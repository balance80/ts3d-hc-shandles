// @ts-check
/// <reference path="hoops_web_viewer.d.ts" />
/// <reference path="communicator_server_integration.d.ts" />

var Sample = {
  /** @param {string} name */
  _getParameterByName: function (name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regexS = '[\\?&]' + name + '=([^&#]*)';
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    return results === null ? null : decodeURIComponent(results[1]);
  },

  // --- NEW: resolve where engine.esm.wasm lives ---
  _inferEnginePath: function () {
    // 1) URL param wins: ?enginePath=/js/hwv
    var ep = Sample._getParameterByName('enginePath');
    if (ep) return ep;

    // 2) Infer from the viewer <script id="hwvScript" src=".../hoops-web-viewer-*.js">
    var tag = /** @type {HTMLScriptElement|null} */ (document.getElementById('hwvScript'));
    if (tag && tag.getAttribute('src')) {
      try {
        var u = new URL(tag.getAttribute('src'), document.baseURI);
        // strip the filename → keep the folder
        return u.pathname.replace(/\/[^\/]*$/, '');
      } catch (e) {
        // fall through to default
      }
    }

    // 3) Sensible default for this demo
    return 'js/hwv';
  },

  _getStreamingMode: function () {
    var streamingMode = Sample._getParameterByName('streamingMode');
    switch (streamingMode) {
      case 'interactive':
        return Communicator.StreamingMode.Interactive;
      case 'all':
        return Communicator.StreamingMode.All;
      case 'ondemand':
        return Communicator.StreamingMode.OnDemand;
    }
    return Communicator.StreamingMode.Interactive;
  },

  _getRenderingLocationString: function () {
    var val = Sample._getParameterByName('viewer');
    return val === 'ssr' ? 'ssr' : 'csr';
  },

  _getRendererType: function () {
    var val = Sample._getRenderingLocationString();
    return val === 'ssr' ? Communicator.RendererType.Server : Communicator.RendererType.Client;
  },

  _getLayout: function () {
    return Sample._getParameterByName('layout');
  },

  _getModel: function () {
    var modelName = Sample._getParameterByName('model') || Sample._getParameterByName('instance');
    return modelName;
  },

  _getMemoryLimit: function () {
    var memoryLimit = Sample._getParameterByName('memoryLimit');
    return memoryLimit === null ? 0 : parseInt(memoryLimit, 10);
  },

  getDisableFloorplan: function () {
    if (typeof SC_DISABLE_AUTOMATIC_FLOORPLAN_OVERLAY !== 'undefined') return SC_DISABLE_AUTOMATIC_FLOORPLAN_OVERLAY;

    var disableFp = Sample._getParameterByName('disableAutomaticFloorplanOverlay');
    return disableFp === null ? false : disableFp === 'true';
  },

  _getProxy: function () {
    var proxy = Sample._getParameterByName('proxy');
    return proxy !== null;
  },

  /** URL parameter "connect". Valid values are "broker" or (default)"direct" */
  _getConnectType: function () {
    var connect = Sample._getParameterByName('connect');
    return connect === 'broker' ? 'broker' : 'direct';
  },

  /** @param {string} endpoint */
  _rewrite: function (endpoint) {
    var regex = /([ws]+):\/\/(.*):([0-9]+)/;
    var matches = regex.exec(endpoint);
    if (matches === null) {
      return endpoint;
    }
    var protocol = matches[1];
    var host = matches[2];
    var port = matches[3];
    return protocol + '://' + host + '/' + protocol + 'proxy/' + port;
  },

  /** Add shared options and NEW enginePath */
  /** @param {Communicator.WebViewerConfig} config */
  _applyExtraProperties: function (config) {
    // REQUIRED in new versions (client rendering)
    if (!config.enginePath) {
      config.enginePath = Sample._inferEnginePath();
    }

    var debug = Sample._getParameterByName('debug');
    if (debug !== null && parseInt(debug, 10) !== 0) {
      config._markImplicitNodesOutOfHierarchy = false;
    }

    var defaultMetallicFactor = Sample._getParameterByName('metallicFactor');
    if (defaultMetallicFactor !== null) config.defaultMetallicFactor = parseFloat(defaultMetallicFactor);

    var defaultRoughnessFactor = Sample._getParameterByName('roughnessFactor');
    if (defaultRoughnessFactor !== null) {
      config.defaultRoughnessFactor = parseFloat(defaultRoughnessFactor);
    }

    return config;
  },

  /** @param {string} serviceBrokerUri */
  _createBrokerViewer: function (serviceBrokerUri) {
    var rendererType = Sample._getRendererType();

    var serviceBroker = new Communicator.ServiceBroker(serviceBrokerUri);
    var serviceRequest = new Communicator.ServiceRequest(
      rendererType === Communicator.RendererType.Client ? Communicator.ServiceClass.CSR_Session : Communicator.ServiceClass.SSR_Session
    );

    return serviceBroker.request(serviceRequest).then(
      function (serviceResponse) {
        if (!serviceResponse.getIsOk()) {
          throw serviceResponse.getReason();
        }
        var serviceProtocol = serviceResponse.getEndpoints().hasOwnProperty(Communicator.ServiceProtocol.WS)
          ? Communicator.ServiceProtocol.WS
          : Communicator.ServiceProtocol.WSS;
        var clientEndpoint = serviceResponse.getEndpoints()[serviceProtocol];

        if (Sample._getProxy()) {
          clientEndpoint = Sample._rewrite(clientEndpoint);
        }

        /** @type {Communicator.WebViewerConfig} */
        var config = {
          containerId: 'viewerContainer',
          endpointUri: clientEndpoint,
          model: Sample._getModel(),
          rendererType: rendererType,
          streamingMode: Sample._getStreamingMode(),
          disableAutomaticFloorplanOverlay: Sample.getDisableFloorplan(),
          enginePath: Sample._inferEnginePath(), // NEW
        };
        Sample._applyExtraProperties(config);
        return new Communicator.WebViewer(config);
      },
      function () {
        throw 'Unable to connect to Service Broker at: ' + serviceBrokerUri;
      }
    );
  },

  /** @param {string|null} scsFile */
  _createScsViewer: function (scsFile) {
    /** @type {Communicator.WebViewerConfig} */
    var config = {
      containerId: 'viewerContainer',
      streamingMode: Sample._getStreamingMode(),
      enginePath: Sample._inferEnginePath(), // NEW
    };

    if (scsFile) {
      config.endpointUri = scsFile;
    } else {
      config.empty = true;
    }

    Sample._applyExtraProperties(config);
    var viewer = new Communicator.WebViewer(config);
    return Promise.resolve(viewer);
  },

  _createEmptyViewer: function () {
    return Sample._createScsViewer(null);
  },

  /** Creates a viewer that will directly connect to a server using a websocket URI.
   * @param {string} uriRoot */
  _createDirectConnectViewer: function (uriRoot) {
    var renderingLocation = Sample._getRenderingLocationString();
    var fullUri = uriRoot + '?renderingLocation=' + renderingLocation;

    /** @type {Communicator.WebViewerConfig} */
    var config = {
      containerId: 'viewerContainer',
      endpointUri: fullUri,
      model: Sample._getModel(),
      rendererType: Sample._getRendererType(),
      streamingMode: Sample._getStreamingMode(),
      memoryLimit: Sample._getMemoryLimit(),
      enginePath: Sample._inferEnginePath(), // NEW
    };
    Sample._applyExtraProperties(config);
    var viewer = new Communicator.WebViewer(config);
    return Promise.resolve(viewer);
  },

  /** @param {string} stylesheetUrl */
  _addStylesheet: function (stylesheetUrl) {
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', stylesheetUrl);
    document.getElementsByTagName('head')[0].appendChild(link);
  },

  screenConfiguration: Communicator.ScreenConfiguration.Desktop,

  _checkforMobile: function () {
    var layout = Sample._getLayout();
    if (layout === 'mobile') {
      Sample._addStylesheet('css/Mobile.css');
      Sample.screenConfiguration = Communicator.ScreenConfiguration.Mobile;
    } else {
      Sample.screenConfiguration = Communicator.ScreenConfiguration.Desktop;
    }
  },

  createViewer: function () {
    Sample._checkforMobile();

    var scsFile = Sample._getParameterByName('scs');

    // The scHost/scPort parameters are intended to be used primarily for debugging
    var scHost = Sample._getParameterByName('scHost');
    var scPort = Sample._getParameterByName('scPort') || '9999';

    // Use a broker style connection if specified
    var useBrokerParam = Sample._getParameterByName('broker');
    var useBroker = useBrokerParam && useBrokerParam === 'true';

    if (scsFile) {
      // SCS loading is handled via a web-server
      return Sample._createScsViewer(scsFile);
    } else if (!Sample._getModel()) {
      // This case happens when a page is first loaded and is thus important
      return Sample._createEmptyViewer();
    } else if (scHost) {
      // Debugging override: direct ws connection (non-SSL)
      return Sample._createDirectConnectViewer('ws://' + scHost + ':' + scPort);
    } else if (useBroker) {
      // Broker connection request/response handshake
      var brokerPort = Sample._getParameterByName('brokerPort') || 11182;
      var brokerUri = window.location.protocol + '//' + window.location.hostname + ':' + brokerPort;
      return Sample._createBrokerViewer(brokerUri);
    } else {
      // Default: use the web-server’s proxy
      var wsPort = Sample._getParameterByName('wsPort') || window.location.port;
      var wsProtocol = window.location.protocol.substring(0, 5) === 'https' ? 'wss' : 'ws';
      var wsUriRoot = wsProtocol + '://' + window.location.hostname + ':' + wsPort;
      return Sample._createDirectConnectViewer(wsUriRoot);
    }
  },
};
