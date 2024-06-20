export function calculateTubeMesh(allPoints, thickness, tess) {
  let faces = [];
  let normals = [];
  let meshData = new Communicator.MeshData();

  let lastPoints = null;
  for (let i = 0; i < allPoints.length; i++) {
    let outpoints = [];
    let delta;
    if (i < allPoints.length - 1) {
      delta = Communicator.Point3.subtract(
        allPoints[i + 1],
        allPoints[i]
      ).normalize();
    } else {
      delta = Communicator.Point3.subtract(
        allPoints[i],
        allPoints[i - 1]
      ).normalize();
    }
    Communicator.Util.generatePointsOnCircle(
      outpoints,
      allPoints[i],
      thickness,
      tess,
      delta
    );

    if (i > 0) {
      let p = outpoints[0];
      let dist = 100000000000;
      let offset = 0;
      for (let k = 0; k < lastPoints.length; k++) {
        if (Communicator.Point3.distance(p, lastPoints[k]) < dist) {
          dist = Communicator.Point3.distance(p, lastPoints[k]);
          offset = k;
        }
      }

      let o1 = offset;
      let oplus;

      if (o1 == lastPoints.length - 1) {
        oplus = 0;
      } else {
        oplus = o1 + 1;
      }

      let k = 0;
      for (let j = 0; j < tess; j++) {
        let o1 = k + offset;
        let o2 = k + offset + 1;
        if (o1 > lastPoints.length - 1) {
          o1 = o1 - lastPoints.length + 1;
        }
        if (o2 > lastPoints.length - 1) {
          o2 = o2 - lastPoints.length + 1;
        }

        k++;
        if (o1 < 0) {
          o1 = lastPoints.length - 1 + o1;
        }
        if (o2 < 0) {
          o2 = lastPoints.length - 1 + o2;
        }

        let j2 = j + 1;

        if (j2 > tess - 1) {
          j2 = 0;
        }
        faces.push(lastPoints[o1].x, lastPoints[o1].y, lastPoints[o1].z);
        faces.push(outpoints[j].x, outpoints[j].y, outpoints[j].z);
        faces.push(outpoints[j2].x, outpoints[j2].y, outpoints[j2].z);

        faces.push(outpoints[j2].x, outpoints[j2].y, outpoints[j2].z);
        faces.push(lastPoints[o2].x, lastPoints[o2].y, lastPoints[o2].z);
        faces.push(lastPoints[o1].x, lastPoints[o1].y, lastPoints[o1].z);

        let plane = Communicator.Plane.createFromPoints(
          lastPoints[o1],
          outpoints[j],
          outpoints[j2]
        );

        for (let k = 0; k < 6; k++) {
          normals.push(plane.normal.x, plane.normal.y, plane.normal.z);
        }
      }
    }
    lastPoints = outpoints;
  }

  meshData.addFaces(faces, normals);
  return meshData;
}

export function performSubnodeRotation(center, startmatrix, rotmatrix) {
  let tmatrix = createTranslationMatrix(center);
  let resmatrix1 = Communicator.Matrix.multiply(
    startmatrix,
    Communicator.Matrix.inverse(tmatrix)
  );
  let resmatrix2 = Communicator.Matrix.multiply(resmatrix1, rotmatrix);
  return Communicator.Matrix.multiply(resmatrix2, tmatrix);
}

export function rotateNormal(matrix, normal) {
  let newpos = matrix.transform(new Communicator.Point3(0, 0, 0));
  let newnormal = matrix.transform(normal);
  let newnormal2 = Communicator.Point3.subtract(newnormal, newpos);
  newnormal2.normalize();
  return newnormal2;
}

export function createTranslationMatrix(point) {
  let matrix = new Communicator.Matrix();
  matrix.setTranslationComponent(point.x, point.y, point.z);
  return matrix;
}

export function rotatePointAndNormal(matrix, point, normal) {
  let newnormal = rotateNormal(matrix, normal);
  normal.set(newnormal.x, newnormal.y, newnormal.z);
  let newpos = matrix.transform(point);
  point.set(newpos.x, newpos.y, newpos.z);
}

export function getCameraPlane(viewer, pos) {
  let c = viewer.view.getCamera();
  let cpos = c.getPosition();
  let ctar = c.getTarget();
  let vec = Communicator.Point3.subtract(ctar, cpos).normalize();
  return Communicator.Plane.createFromPointAndNormal(pos, vec);
}

export function signedAngleFromPoint(p1, p2, normal, porigin) {
  let p1r = Communicator.Point3.subtract(p1, porigin);
  let p2r = Communicator.Point3.subtract(p2, porigin);
  return signedAngle(p1r, p2r, normal);
}

export async function createSphereMesh(viewer) {
  const t = (1 + Math.sqrt(5)) / 2;

  const ratio = Math.sqrt(10 + 2 * Math.sqrt(5)) / (4 * t);
  const a = ratio / 2;
  const b = ratio / (2 * t);

  // calculate starting vertices
  const points = [];

  points[0] = new Communicator.Point3(-b, a, 0);
  points[1] = new Communicator.Point3(b, a, 0);
  points[2] = new Communicator.Point3(-b, -a, 0);
  points[3] = new Communicator.Point3(b, -a, 0);

  points[4] = new Communicator.Point3(0, -b, a);
  points[5] = new Communicator.Point3(0, b, a);
  points[6] = new Communicator.Point3(0, -b, -a);
  points[7] = new Communicator.Point3(0, b, -a);

  points[8] = new Communicator.Point3(a, 0, -b);
  points[9] = new Communicator.Point3(a, 0, b);
  points[10] = new Communicator.Point3(-a, 0, -b);
  points[11] = new Communicator.Point3(-a, 0, b);

  for (let i = 0; i < points.length; i++) {
    points[i].normalize();
  }

  // add starting faces
  let faces = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],

    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],

    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],

    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];

  // refine sphere
  let count = 12;
  const refineIterations = 3;
  for (let i = 0; i < refineIterations; i++) {
    let faces2 = [];
    faces.map((face) => {
      const p0 = points[face[0]];
      const p1 = points[face[1]];
      const p2 = points[face[2]];

      points[count++] = new Communicator.Point3(
        p0.x + p1.x,
        p0.y + p1.y,
        p0.z + p1.z
      )
        .scale(0.5)
        .normalize();
      points[count++] = new Communicator.Point3(
        p1.x + p2.x,
        p1.y + p2.y,
        p1.z + p2.z
      )
        .scale(0.5)
        .normalize();
      points[count++] = new Communicator.Point3(
        p2.x + p0.x,
        p2.y + p0.y,
        p2.z + p0.z
      )
        .scale(0.5)
        .normalize();

      faces2.push([face[0], count - 3, count - 1]);
      faces2.push([count - 3, count - 2, count - 1]);
      faces2.push([count - 3, face[1], count - 2]);
      faces2.push([count - 2, face[2], count - 1]);
    });
    faces = faces2;
  }

  const vertexData = [];
  const normalData = [];
  for (const face of faces) {
    for (let j = 0; j < 3; j++) {
      const index = face[j];
      vertexData.push(points[index].x);
      vertexData.push(points[index].y);
      vertexData.push(points[index].z);

      const normal = points[index].normalize();
      normalData.push(normal.x);
      normalData.push(normal.y);
      normalData.push(normal.z);
    }
  }

  const meshData = new Communicator.MeshData();
  meshData.addFaces(vertexData, normalData);
  meshData.setFaceWinding(Communicator.FaceWinding.CounterClockwise);
  return await viewer.model.createMesh(meshData);
}

export function signedAngle(Va, Vb, Vn) {
  return (
    Math.atan2(
      Communicator.Point3.dot(Communicator.Point3.cross(Va, Vb), Vn),
      Communicator.Point3.dot(Va, Vb)
    ) *
    (180 / Math.PI)
  );
}

export function closestPointOnPlane(plane, point) {
  let distance = Communicator.Point3.dot(plane.normal, point) + plane.d;
  return Communicator.Point3.subtract(
    point,
    new Communicator.Point3(
      distance * plane.normal.x,
      distance * plane.normal.y,
      distance * plane.normal.z
    )
  );
}

export function nearestPointOnLine(linePnt, lineDir, pnt) {
  lineDir.normalize(); //this needs to be a unit vector
  var v = Communicator.Point3.subtract(pnt, linePnt);
  var d = Communicator.Point3.dot(v, lineDir);
  var pol = Communicator.Point3.add(
    linePnt,
    Communicator.Point3.scale(lineDir, d)
  );
  var delta = Communicator.Point3.subtract(pol, pnt);
  return pol;
}

export function getClosestPoint(
  viewer,
  selectionPosition,
  normal,
  currentPosition
) {
  const p1 = selectionPosition.copy();
  const p2 = selectionPosition.copy().add(normal);
  const p3 = viewer.view.unprojectPoint(currentPosition, 0);
  const p4 = viewer.view.unprojectPoint(currentPosition, 0.5);

  if (p3 !== null && p4 !== null) {
    return Communicator.Util.lineLineIntersect(p1, p2, p3, p4);
  }
  return null;
}

export async function createPlaneMesh(viewer, offsetx, offsety, length) {
  var meshData = new Communicator.MeshData();
  meshData.setFaceWinding(Communicator.FaceWinding.None);

  let faces = [
    -length + offsetx,
    length + offsety,
    0,
    length + offsetx,
    length + offsety,
    0,
    -length + offsetx,
    -length + offsety,
    0,
    length + offsetx,
    length + offsety,
    0,
    length + offsetx,
    -length + +offsety,
    0,
    -length + +offsetx,
    -length + offsety,
    0,
  ];

  var normals = [
    //front
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  ];

  meshData.addFaces(faces);

  return await viewer.model.createMesh(meshData);
}

export async function createCubeMesh(viewer, offset, scale) {
  let length;
  if (scale != undefined) length = 0.5 * scale;
  else length = 0.5;

  var meshData = new Communicator.MeshData();
  meshData.setFaceWinding(Communicator.FaceWinding.None);

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

  meshData.addFaces(vertices, normals);
  return await viewer.model.createMesh(meshData);
}

export function ComputeVectorToVectorRotationMatrix(p1, p2) {
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
