class ViewerUtility {
  static ComputeVectorToVectorRotationMatrix(p1, p2) {
    var outmatrix;
    const EPSILON = 0.0000001;
    p1.normalize();
    p2.normalize();
    let p3 = Communicator.Point3.cross(p1, p2);

    let dprod = Communicator.Point3.dot(p1, p2);
    let l = p3.length();

    // Construct a perpendicular vector for anti-parallel case
    if (l > -EPSILON && l < EPSILON) {
      if (dprod < 0) {
        if (p1.x < -EPSILON || p1.x > EPSILON) {
          p3.x = p1.y;
          p3.y = -p1.x;
          p3.z = 0;
        } else if (p1.y < -EPSILON || p1.y > EPSILON) {
          p3.x = -p1.y;
          p3.y = p1.x;
          p3.z = 0;
        } else if (p1.z < -EPSILON || p1.z > EPSILON) {
          p3.x = -p1.z;
          p3.z = p1.x;
          p3.y = 0;
        } else {
          return new Communicator.Matrix();
        }
      } else {
        return new Communicator.Matrix();
      }
    }

    var ang = Math.atan2(l, dprod);
    ang *= 180 / Math.PI;

    return Communicator.Matrix.createFromOffAxisRotation(p3, ang);
  }

  static async createFloorQuad(viewer, x, y) {
    var length = 0.5;
    length = 0.5;

    var meshData = new Communicator.MeshData();
    meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);
    var polyline = [
      -length + x,
      length + y,
      -0.5,
      length + x,
      length + y,
      -0.5,
      length + x,
      -length + y,
      -0.5,
      -length + x,
      -length + y,
      -0.5,
      -length + x,
      length + y,
      -0.5,
    ];
    meshData.addPolyline(polyline);
    return await viewer.model.createMesh(meshData);
  }

  static async createCubeMesh(viewer, showFaces, offset, scale) {
    var length;
    if (scale != undefined) length = 0.5 * scale;
    else length = 0.5;

    var meshData = new Communicator.MeshData();
    meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);

    var vertices = [
      //front
      -length,
      length,
      length,
      length,
      length,
      length,
      -length,
      -length,
      length,
      length,
      length,
      length,
      length,
      -length,
      length,
      -length,
      -length,
      length,
      //back
      length,
      length,
      -length,
      -length,
      length,
      -length,
      -length,
      -length,
      -length,
      length,
      length,
      -length,
      -length,
      -length,
      -length,
      length,
      -length,
      -length,
      //top
      -length,
      length,
      -length,
      length,
      length,
      -length,
      length,
      length,
      length,
      -length,
      length,
      -length,
      length,
      length,
      length,
      -length,
      length,
      length,
      //bottom
      -length,
      -length,
      -length,
      length,
      -length,
      length,
      length,
      -length,
      -length,
      -length,
      -length,
      -length,
      -length,
      -length,
      length,
      length,
      -length,
      length,
      //left
      -length,
      length,
      -length,
      -length,
      length,
      length,
      -length,
      -length,
      -length,
      -length,
      length,
      length,
      -length,
      -length,
      length,
      -length,
      -length,
      -length,
      //right
      length,
      length,
      length,
      length,
      length,
      -length,
      length,
      -length,
      -length,
      length,
      length,
      length,
      length,
      -length,
      -length,
      length,
      -length,
      length,
    ];
    if (offset != undefined) {
      for (var i = 0; i < vertices.length; i += 3) {
        vertices[i] += offset.x;
        vertices[i + 1] += offset.y;
        vertices[i + 2] += offset.z;
      }
    }
    var normals = [
      //front
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      //back
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      //top
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      //bottom
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      //left
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      //right
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    ];

    var polylines = [
      [-length, length, length, length, length, length, length, -length, length, -length, -length, length, -length, length, length],
      [length, length, length, length, length, -length, length, -length, -length, length, -length, length, length, length, length],
      [-length, length, -length, length, length, -length, length, -length, -length, -length, -length, -length, -length, length, -length],
      [-length, length, length, -length, length, -length, -length, -length, -length, -length, -length, length, -length, length, length],
    ];
    if (showFaces) meshData.addFaces(vertices, normals);
    else {
      for (let i = 0; i < polylines.length; i++) meshData.addPolyline(polylines[i]);
    }
    return await viewer.model.createMesh(meshData);
  }

  static async createLineMesh(viewer, start, end) {
    var meshData = new Communicator.MeshData();
    meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);

    meshData.addPolyline([start.x, start.y, start.z, end.x, end.y, end.z]);

    return await viewer.model.createMesh(meshData);
  }

  static async createDebugCube(viewer, pos, scale = 0.3, color = new Communicator.Color(255, 0, 0), flush = false) {
    if (window.debugCubeNode === undefined) {
      window.debugCubeNode = viewer.model.createNode(viewer.model.getRootNode());
    }

    if (flush) {
      viewer.model.deleteNode(window.debugCubeNode);
      window.debugCubeNode = viewer.model.createNode(viewer.model.getRootNode());
    }
    let cubeMesh = await ViewerUtility.createCubeMesh(viewer, true, pos, scale);
    let myMeshInstanceData = new Communicator.MeshInstanceData(cubeMesh);
    var ttt = viewer.model.createNode(window.debugCubeNode);
    let cubenode = await viewer.model.createMeshInstance(myMeshInstanceData, ttt);
    if (color) viewer.model.setNodesFaceColor([ttt], color);
    return ttt;
  }

  static async rotateNodeFromHandle(angle, viewer) {
    var handleOperator = viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
    if (handleOperator.getPosition()) {
      let pos = handleOperator.getPosition();
      let axis = handlePlacementOperator.lastAxis;

      var selections = viewer.selectionManager.getResults();
      var nodeid = selections[0].getNodeId();

      var netmatrix = viewer.model.getNodeNetMatrix(nodeid);
      var netmatrixinverse = Communicator.Matrix.inverse(netmatrix);
      var pivot = netmatrixinverse.transform(pos);

      var pivotaxis = netmatrixinverse.transform(new Communicator.Point3(pos.x + axis.x, pos.y + axis.y, pos.z + axis.z));
      var resaxis = Communicator.Point3.subtract(pivotaxis, pivot).normalize();

      await ViewerUtility.rotateNode(nodeid, angle, pivot, resaxis);
    }
  }

  static async rotateNode(nodeid, angle, center, axis, viewer) {
    var startmatrix = viewer.model.getNodeMatrix(nodeid);
    var offaxismatrix = new Communicator.Matrix();
    var transmatrix = new Communicator.Matrix();

    transmatrix = new Communicator.Matrix();
    transmatrix.setTranslationComponent(-center.x, -center.y, -center.z);

    var invtransmatrix = new Communicator.Matrix();
    invtransmatrix.setTranslationComponent(center.x, center.y, center.z);

    Communicator.Util.computeOffaxisRotation(axis, angle, offaxismatrix);

    var result = Communicator.Matrix.multiply(transmatrix, offaxismatrix);
    var result2 = Communicator.Matrix.multiply(result, invtransmatrix);

    let final = Communicator.Matrix.multiply(result2, startmatrix);
    await viewer.model.setNodeMatrix(nodeid, final);
  }

  static async loadMultipleModels(models, viewer) {
    let startnode = viewer.model.createNode(viewer.model.getRootNode());
    for (let i = 0; i < models.length; i++) {
      let model = models[i].split('.')[0];
      let newnode = viewer.model.createNode(startnode, model);
      await viewer.model.loadSubtreeFromScsFile(newnode, models[i]);
    }
    return startnode;
  }

  static async getObjectBounding(nodeid, viewer) {
    let bounds = await viewer.model.getNodesBounding([nodeid]);

    let matrix = Communicator.Matrix.inverse(viewer.model.getNodeNetMatrix(nodeid));
    let boxcorners = bounds.getCorners();
    let boxtransformed = [];
    matrix.transformArray(boxcorners, boxtransformed);

    let outbounds = new Communicator.Box();
    outbounds.min = boxtransformed[0].copy();
    outbounds.max = boxtransformed[0].copy();

    for (let i = 1; i < boxtransformed.length; i++) {
      outbounds.addPoint(boxtransformed[i]);
    }

    return outbounds;
  }

  static async generateShatteredXMLFromNode(name, parentnode, viewer) {
    let polist = [];
    let instancehash = [];

    let currentid = 2;
    let pochildrentext = '';
    let children = viewer.model.getNodeChildren(parentnode);

    for (let i = 0; i < children.length; i++) {
      let nodeid = children[i];
      let nodename = viewer.model.getNodeName(nodeid);

      let instance = instancehash[nodename];
      pochildrentext += currentid + ' ';
      if (instance == undefined) {
        let instanceRefId = currentid + 1;
        polist.push({ nodeid: nodeid, id: currentid, instanceref: instanceRefId });
        polist.push({ nodeid: nodeid, id: instanceRefId });
        instancehash[nodename] = { id: instanceRefId, count: 0 };
        currentid++;
      } else {
        polist.push({ nodeid: nodeid, id: currentid, instanceref: instance.id });
      }
      currentid++;
    }

    let xml = '';
    xml += '<!--HC 22.0.0-->\n';
    xml += '<Root>\n';
    xml += '<ModelFile>\n';
    xml += '<ProductOccurence Id="0" Name="' + name + '" Behaviour="1" Children="1" IsPart="false" Unit="1000.000000"/>\n';
    xml +=
      '<ProductOccurence Id="1" Name="' +
      name +
      ':Master" ExchangeId="" LayerId="65535" Style="65535" Behaviour="1" FilePath="" Children="' +
      pochildrentext +
      '" IsPart="false"/>\n';

    for (let i = 0; i < polist.length; i++) {
      let nodename = viewer.model.getNodeName(polist[i].nodeid);
      if (polist[i].instanceref != undefined) {
        let instance = instancehash[nodename];
        xml +=
          '<ProductOccurence Id="' +
          polist[i].id +
          '" Name="' +
          nodename +
          ':' +
          instance.count++ +
          '" ExchangeId="" LayerId="65535" Style="65535" Behaviour="1" FilePath="" InstanceRef="' +
          instance.id +
          '" IsPart="false">\n';

        let matrix = viewer.model.getNodeMatrix(polist[i].nodeid);

        xml +=
          '<Transformation RelativeTransfo="' +
          matrix.m[0] +
          ' ' +
          matrix.m[1] +
          ' ' +
          matrix.m[2] +
          ' ' +
          matrix.m[3] +
          ' ' +
          matrix.m[4] +
          ' ' +
          matrix.m[5] +
          ' ' +
          matrix.m[6] +
          ' ' +
          matrix.m[7] +
          ' ' +
          matrix.m[8] +
          ' ' +
          matrix.m[9] +
          ' ' +
          matrix.m[10] +
          ' ' +
          matrix.m[11] +
          ' ' +
          matrix.m[12] +
          ' ' +
          matrix.m[13] +
          ' ' +
          matrix.m[14] +
          ' ' +
          matrix.m[15] +
          '"/>\n';
        xml += '</ProductOccurence>' + '\n';
      } else {
        xml += '<ProductOccurence Id="' + polist[i].id + '" Name="" ExchangeId="" Behaviour="1" IsPart="false">' + '\n';
        xml += '<ExternalModel Name="' + nodename + '" Unit="1000.000000">' + '\n';

        let bounding = await ViewerUtility.getObjectBounding(polist[i].nodeid, viewer);

        xml +=
          '<BoundingBox Min="' +
          bounding.min.x +
          ' ' +
          bounding.min.y +
          ' ' +
          bounding.min.z +
          '" Max="' +
          bounding.max.x +
          ' ' +
          bounding.max.y +
          ' ' +
          bounding.max.z +
          '"/>\n';
        xml += '</ExternalModel>\n';
        xml += '</ProductOccurence>\n';
      }
    }
    xml += '</ModelFile>\n';
    xml += '</Root>\n';
    return xml;
  }
}
