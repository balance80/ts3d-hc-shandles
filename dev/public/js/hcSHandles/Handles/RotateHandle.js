import { StandardHandle, handleType } from "./StandardHandle.js";
import * as utility from "../utility.js";

export class RotateHandle extends StandardHandle {
  constructor(group, axis, rot, color) {
    super(group);
    this._type = handleType.axis;
    this._axis = axis;
    this._rotation = rot;
    this._color = color;
    this._startRotationMatrixCache = [];    
  }

  async generateBaseGeometry() {
    let outpoints = [];
    Communicator.Util.generatePointsOnCircle(
      outpoints,
      new Communicator.Point3(0, 0, 0),
      0.15,
      64,
      new Communicator.Point3(0, 0, 1)
    );
    let meshData = utility.calculateTubeMesh(
      outpoints.splice(0, outpoints.length / 2),
      0.0055,
      10
    );
    this._group.getManager()._arcmesh = await this._group
      .getViewer()
      .model.createMesh(meshData);
  }

  async show() {
    let viewer = this._group.getViewer();

    let offaxismatrix = new Communicator.Matrix();
    if (this._axis) {
      Communicator.Util.computeOffaxisRotation(
        this._axis,
        this._rotation,
        offaxismatrix
      );
    }
    this._nodeid = viewer.model.createNode(this._group._topNode, "");

    if (!this._group.getManager()._arcmesh) {
      await this.generateBaseGeometry();
    }

    let myMeshInstanceData = new Communicator.MeshInstanceData(
      this._group.getManager()._arcmesh
    );
    await viewer.model.createMeshInstance(myMeshInstanceData, this._nodeid);
    if (this._axis) {
      viewer.model.setNodeMatrix(this._nodeid, offaxismatrix);
    }
    viewer.model.setNodesFaceColor([this._nodeid], this._color);

    await super.show();
    await this.orientToCamera(viewer.view.getCamera());
  }

  cameraUpdate(camera) {
    this.orientToCamera(camera);
  }

  update(camera) {
    this.orientToCamera(camera);
  }

  async orientToCamera(camera) {
    let viewer = this._group.getViewer();
    let camPos = camera.getPosition();
    let camTar = camera.getTarget();
    let dir = Communicator.Point3.subtract(camTar, camPos).normalize();
    camPos.x = camTar.x - dir.x * 100000;
    camPos.y = camTar.y - dir.y * 100000;
    camPos.z = camTar.z - dir.z * 100000;
    let matx = viewer.model.getNodeMatrix(this._nodeid);

    let mat = viewer.model.getNodeNetMatrix(this._nodeid);

    let xc1 = utility.rotateNormal(mat, new Communicator.Point3(0, 0, 1));
    //        console.log(xc1.x + " " + xc1.y + " " + xc1.z);
    let xc2 = Communicator.Point3.subtract(
      viewer.view.getCamera().getTarget(),
      camPos
    ).normalize();
    if (xc1.equalsWithTolerance(xc2, 0.01)) {
      return;
    }
    let matinverse = Communicator.Matrix.inverse(mat);
    let camPos2 = matinverse.transform(camPos);
    let plane = Communicator.Plane.createFromPointAndNormal(
      new Communicator.Point3(0, 0, 0),
      new Communicator.Point3(0, 0, 1)
    );
    let res = utility.closestPointOnPlane(plane, camPos2);
    res.normalize();
    let angle = utility.signedAngle(
      new Communicator.Point3(-1, 0, 0),
      res,
      new Communicator.Point3(0, 0, 1)
    );
    if (isNaN(angle)) {
      return;
    }
    let offaxismatrix = new Communicator.Matrix();
    Communicator.Util.computeOffaxisRotation(
      new Communicator.Point3(0, 0, 1),
      angle,
      offaxismatrix
    );

    let resmatrix = Communicator.Matrix.multiply(offaxismatrix, matx);
    await viewer.model.setNodeMatrix(this._nodeid, resmatrix);
  }

  async handleMouseMove(event) {
    let viewer = this._group.getViewer();

    // Cache the start rotation matrices so we can reset the rotation if needed
    if (this._startRotationMatrixCache.length === 0) {
      for (let i = 0; i < this._startTargetMatrices.length; i++) {
        const startRotationMatrix = this._startTargetMatrices[i].copy();
        this._startRotationMatrixCache.push(startRotationMatrix);
      }
    }

    // Reset rotation back to start
    if (this._group.getManager()._resetSnapping) {
      for (let i = 0; i < this._startTargetMatrices.length; i++) {
        const cachedStartRotationMatrix = this._startRotationMatrixCache[i].copy();
        viewer.model.setNodeMatrix(
          this._group._targetNodes[i],
          cachedStartRotationMatrix
        );
      }
      return;
    }

    let newpos = new Communicator.Point3(0, 0, 0);
    let newnormal = new Communicator.Point3(0, 0, 1);
    utility.rotatePointAndNormal(this._startmatrix, newpos, newnormal);

    let cameraplane = utility.getCameraPlane(viewer, this._startPosition);

    let ray = viewer.view.raycastFromPoint(event.getPosition());
    let planeIntersection = new Communicator.Point3();
    cameraplane.intersectsRay(ray, planeIntersection);

    let rplane = Communicator.Plane.createFromPointAndNormal(newpos, newnormal);
    let adist = Math.abs(
      Communicator.Util.computeAngleBetweenVector(newnormal, cameraplane.normal)
    );

    let out = new Communicator.Point3();
    if (adist > 85 && adist < 95) {
      out = utility.closestPointOnPlane(rplane, planeIntersection);
    } else {
      let ray = viewer.view.raycastFromPoint(event.getPosition());
      let cameraplane = Communicator.Plane.createFromPointAndNormal(
        newpos,
        newnormal
      );
      cameraplane.intersectsRay(ray, out);
    }

    let angle = utility.signedAngleFromPoint(
      this._startPosition,
      out,
      newnormal,
      newpos
    );

    if (this._group.getManager()._rotateSnapping) {
      angle =
        Math.round(angle / this._group.getManager()._rotateSnapping) *
        this._group.getManager()._rotateSnapping;
    }

    for (let i = 0; i < this._startTargetMatrices.length; i++) {
      let newnormal2 = utility.rotateNormal(
        Communicator.Matrix.inverse(
          viewer.model.getNodeNetMatrix(
            viewer.model.getNodeParent(this._group._targetNodes[i])
          )
        ),
        newnormal
      );

      let offaxismatrix = new Communicator.Matrix();
      Communicator.Util.computeOffaxisRotation(
        newnormal2,
        angle,
        offaxismatrix
      );
      let center = Communicator.Matrix.inverse(
        viewer.model.getNodeNetMatrix(
          viewer.model.getNodeParent(this._group._targetNodes[i])
        )
      ).transform(this._group._targetCenter);

      viewer.model.setNodeMatrix(
        this._group._targetNodes[i],
        utility.performSubnodeRotation(
          center,
          this._startTargetMatrices[i],
          offaxismatrix
        )
      );
    }

    this._group.updateHandle();
    super.handleMouseMove(event);
  }
}
