var mySHandleManager = null;
var relative = true;
var useSelectionPosition = false;
var theViewer;

async function msready() {
  mySHandleManager = new shandles.SHandleManager(theViewer);

  theViewer.selectionManager.setSelectionFilter(function (nodeid) {
    return nodeid;
  });

  theViewer.view.getAxisTriad().enable();
}

function createTriangleMeshData() {
  const vertexData = [0, 0, 0, 0, 1, 0, 1, 0, 0];

  const normalData = [0, 0, 1, 0, 0, 1, 0, 0, 1];

  const meshData = new Communicator.MeshData();
  meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);
  meshData.addFaces(vertexData, normalData);

  return meshData;
}

async function createTriangleNode(model) {
  const meshData = createTriangleMeshData();
  const meshId = await model.createMesh(meshData);

  let meshInstanceData = new Communicator.MeshInstanceData(meshId);
  meshInstanceData.setFaceColor(Communicator.Color.blue());
  const nodeId = await model.createMeshInstance(meshInstanceData);

  return nodeId;
}

function startup(viewer) {
  theViewer = viewer;
  createUILayout();
}

function createUILayout() {
  let config = {
    settings: {
      showPopoutIcon: false,
      showMaximiseIcon: true,
      showCloseIcon: false,
    },
    content: [
      {
        type: 'row',
        content: [
          {
            type: 'column',
            content: [
              {
                type: 'component',
                componentName: 'Viewer',
                isClosable: false,
                width: 83,
                componentState: { label: 'A' },
              },
            ],
          },
          {
            type: 'column',
            width: 17,
            height: 35,
            content: [
              {
                type: 'component',
                componentName: 'Settings',
                isClosable: true,
                height: 15,
                componentState: { label: 'C' },
              },
            ],
          },
        ],
      },
    ],
  };

  let myLayout = new GoldenLayout(config);
  myLayout.registerComponent('Viewer', function (container, componentState) {
    $(container.getElement()).append($('#content'));
  });

  myLayout.registerComponent('Settings', function (container, componentState) {
    $(container.getElement()).append($('#settingsdiv'));
  });

  myLayout.on('stateChanged', function () {
    if (theViewer != null) {
      theViewer.resizeCanvas();
    }
  });
  myLayout.init();
}

function drawTriangle() {
  createTriangleNode(theViewer.model);
}

function gatherSelection() {
  let nodeids = [];
  let sels = theViewer.selectionManager.getResults();

  for (let i = 0; i < sels.length; i++) {
    nodeids.push(sels[i].getNodeId());
  }
  return nodeids;
}

async function showRotateHandlesFromSelection(axisHandles) {
  let offaxismatrix = new Communicator.Matrix();
  Communicator.Util.computeOffaxisRotation(new Communicator.Point3(0, 0, 1), 45, offaxismatrix);
  let handleGroup = new shandles.RotateHandleGroup(mySHandleManager);
  addHandles(handleGroup, axisHandles);
}

async function showTranslateHandlesFromSelection(axisHandles) {
  let handleGroup = new shandles.TranslateHandleGroup(mySHandleManager);
  addHandles(handleGroup, axisHandles);
}

async function showScaleHandlesFromSelection(axisHandles) {
  let handleGroup = new shandles.ScaleHandleGroup(mySHandleManager);
  addHandles(handleGroup, axisHandles);
}

async function addHandles(handleGroup, axisHandles) {
  await mySHandleManager.remove();

  handleGroup.setAxisHandles(axisHandles);
  handleGroup.setRelative(relative);
  if (useSelectionPosition) {
    let sel = theViewer.selectionManager.getFirst();
    let result = await mySHandleManager.positionFromSelection(sel);
    if (result) {
      mySHandleManager.add(handleGroup, gatherSelection(), result.position, result.rotation);
    } else {
      mySHandleManager.add(handleGroup, gatherSelection());
    }
  } else {
    mySHandleManager.add(handleGroup, gatherSelection());
  }
}

async function toggleRelative() {
  relative = document.getElementById('relativecheck').checked;
  await mySHandleManager.setRelative(relative);
}

function refreshHandles() {
  mySHandleManager.refreshAll();
}

function toggleUseSelectionPosition() {
  useSelectionPosition = document.getElementById('useselectionpositioncheck').checked;
}

function undo() {
  mySHandleManager.undo();
}

function redo() {
  mySHandleManager.redo();
}
function toggleEnableTranslateSnapping() {
  if (document.getElementById('translatesnapcheck').checked) {
    mySHandleManager.setTranslateSnapping(parseInt($('#translateSnappingEdit').val()));
  } else {
    mySHandleManager.setTranslateSnapping(0);
  }
}

function toggleEnableRotateSnapping() {
  if (document.getElementById('rotatesnapcheck').checked) {
    mySHandleManager.setRotateSnapping(parseInt($('#rotateSnappingEdit').val()));
  } else {
    mySHandleManager.setRotateSnapping(0);
  }
}

function handleScaleEditChange() {
  mySHandleManager.setHandleScale(parseFloat($('#handleScaleEdit').val()));
}
