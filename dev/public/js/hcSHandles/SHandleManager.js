import { UndoManager, RotateUndo } from "./UndoManager.js";
import { SHandleOperator } from "./SHandleOperator.js";

import * as utility from "./utility.js";

export class SHandleManager {
  constructor(viewer) {
    this._viewer = viewer;
    this._translateSnapping = 0;
    this._rotateSnapping = 0;
    this._handleScale = 1.0;
    this._undoManager = new UndoManager(viewer);
    this._handles = [];
    this._undoManager = new UndoManager(viewer);
    this._handlenode = this._viewer.model.createNode(
      this._viewer.model.getRootNode(),
      "advancedHandles"
    );
    var _this = this;
    this._eventReceivers = [];

    this._viewer.overlayManager.setCamera(
      SHandleManager.overlayIndex,
      this._viewer.view.getCamera()
    );

    this._viewer.setCallbacks({
      camera: function (type, nodeids, mat1, mat2) {
        _this._viewer.overlayManager.setCamera(
          SHandleManager.overlayIndex,
          _this._viewer.view.getCamera()
        );

        for (let i = 0; i < _this._handles.length; i++) {
          _this._handles[i].cameraUpdate(_this._viewer.view.getCamera());
        }
      },
    });

    this._viewer.overlayManager.setViewport(
      SHandleManager.overlayIndex,
      Communicator.OverlayAnchor.UpperLeftCorner,
      0,
      Communicator.OverlayUnit.ProportionOfCanvas,
      0,
      Communicator.OverlayUnit.ProportionOfCanvas,
      1,
      Communicator.OverlayUnit.ProportionOfCanvas,
      1,
      Communicator.OverlayUnit.ProportionOfCanvas
    );

    this._viewer.overlayManager.setCamera(
      SHandleManager.overlayIndex,
      this._viewer.view.getCamera()
    );

    let mySHandleOperator = new SHandleOperator(this._viewer, this);
    let SHandleOperatorHandle =
      this._viewer.operatorManager.registerCustomOperator(mySHandleOperator);
    this._viewer.operatorManager.push(SHandleOperatorHandle);
  }

  registerEventReceiver(receiver) {
    this._eventReceivers.push(receiver);
  }

  transmitEvent(nodeids) {
    for (let i = 0; i < this._eventReceivers.length; i++) {
      this._eventReceivers[i](nodeids);
    }
  }

  async add(handleGroup, nodeid, center = null, rotation = null) {
    this._handles.push(handleGroup);
    await handleGroup.show(nodeid, center, rotation);
  }

  async remove() {
    await this._viewer.model.deleteNode(this._handlenode);
    this._handlenode = await this._viewer.model.createNode(
      this._viewer.model.getRootNode(),
      "advancedHandles"
    );
    this._handles = [];
  }

  getHandleGroup(nodeid) {
    for (let i = 0; i < this._handles.length; i++) {
      if (
        this._handles[i]._topNode == nodeid ||
        this._handles[i]._topNode2 == nodeid
      ) {
        return this._handles[i];
      }
    }
  }

  refreshAll(activeHandle = null) {
    this._viewer.overlayManager.setCamera(
      SHandleManager.overlayIndex,
      this._viewer.view.getCamera()
    );
    for (let i = 0; i < this._handles.length; i++) {
      if (this._handles[i] != activeHandle) {
        this._handles[i]._targetCenter = this._viewer.model
          .getNodeNetMatrix(this._handles[i]._targetNodes[0])
          .transform(this._handles[i]._targetCenterLocal);
        this._handles[i].updateHandle();
      }
    }
  }

  setRelative(relative) {
    for (let i = 0; i < this._handles.length; i++) {
      this._handles[i].setRelative(relative);
    }
  }

  async _getArcCenter(selectionItem) {
    let nodeId = selectionItem.getNodeId();
    let lineEntity = selectionItem.getLineEntity();

    if (nodeId !== null && lineEntity !== null) {
      let model = this._viewer.model;

      let subentityProperty = await model.getEdgeProperty(
        nodeId,
        lineEntity.getLineId()
      );
      if (
        subentityProperty instanceof
        Communicator.SubentityProperties.CircleElement
      ) {
        const center = subentityProperty.origin;
        const matrix = model.getNodeNetMatrix(nodeId);
        matrix.transform(center, center);
        return { center: center, normal: subentityProperty.normal };
      }
      return null;
    }
  }

  async positionFromSelection(selectionItem) {
    let nodeId = selectionItem.getNodeId();
    let faceEntity = selectionItem.getFaceEntity();
    let lineEntity = selectionItem.getLineEntity();
    let position = null;
    let axis = null;

    if (lineEntity !== null || faceEntity !== null) {
      if (lineEntity != null) {
        let pt = await this._getArcCenter(selectionItem);
        if (pt) {
          if (pt.normal) {
            let mat = this._viewer.model.getNodeNetMatrix(nodeId);
            let p1 = mat.transform(new Communicator.Point3(0, 0, 0));
            let p2 = mat.transform(pt.normal);
            let cross = Communicator.Point3.cross(
              new Communicator.Point3(1, 0, 0),
              pt.normal
            );
            if (cross.length() < 0.00001)
              cross = Communicator.Point3.cross(
                new Communicator.Point3(0, 1, 0),
                pt.normal
              );

            axis = Communicator.Point3.subtract(p2, p1);
          }
          position = pt.center;
        } else {
          let points = lineEntity.getPoints();
          axis = Communicator.Point3.subtract(points[1], points[0]);

          let length_1 = axis.length();
          position = points[0].copy().add(axis.normalize().scale(length_1 / 2));
        }
      } else {
        axis = faceEntity.getNormal();
        position = faceEntity.getBounding().center().copy();
      }
      let rotation = utility.ComputeVectorToVectorRotationMatrix(
        new Communicator.Point3(1, 0, 0),
        axis
      );
      let matrix = this._viewer.model.getNodeNetMatrix(nodeId);

      let row1 = new Communicator.Point3(
        matrix.m[0],
        matrix.m[1],
        matrix.m[2]
      ).normalize();
      let row2 = new Communicator.Point3(
        matrix.m[4],
        matrix.m[5],
        matrix.m[6]
      ).normalize();
      let row3 = new Communicator.Point3(
        matrix.m[8],
        matrix.m[9],
        matrix.m[10]
      ).normalize();

      let normalizedMatrix = new Communicator.Matrix();

      normalizedMatrix.m[0] = row1.x;
      normalizedMatrix.m[1] = row1.y;
      normalizedMatrix.m[2] = row1.z;

      normalizedMatrix.m[4] = row2.x;
      normalizedMatrix.m[5] = row2.y;
      normalizedMatrix.m[6] = row2.z;

      normalizedMatrix.m[8] = row3.x;
      normalizedMatrix.m[9] = row3.y;
      normalizedMatrix.m[10] = row3.z;
      let matinv = Communicator.Matrix.inverse(normalizedMatrix);

      rotation = Communicator.Matrix.multiply(rotation, matinv);

      return { position: position, rotation: rotation };
    }
  }

  setUndoPoint(nodeids) {
    let undoPoint = new RotateUndo();
    undoPoint.gather(this._viewer, nodeids);
    this._undoManager.setUndoPoint([undoPoint]);
  }

  undo() {
    this._undoManager.undo();
    this.refreshAll();
  }

  redo() {
    this._undoManager.redo();
    this.refreshAll();
  }

  setTranslateSnapping(snapping) {
    this._translateSnapping = snapping;
  }

  setRotateSnapping(snapping) {
    this._rotateSnapping = snapping;
  }

  setHandleScale(scale) {
    this._handleScale = scale;
    this.refreshAll();
  }
}

SHandleManager.overlayIndex = 7;
