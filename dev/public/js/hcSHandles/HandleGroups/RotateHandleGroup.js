import { StandardHandleGroup } from "./StandardHandleGroup.js";
import { RotateHandle } from "../Handles/RotateHandle.js";
import { RotateTrackballHandle } from "../Handles/RotateTrackballHandle.js";
import { RotateViewplaneHandle } from "../Handles/RotateViewplaneHandle.js";

export class RotateHandleGroup extends StandardHandleGroup {
  constructor(manager) {
    super(manager);
  }

  async show(nodeids, center = null, rotation = null) {
    await super.show(nodeids, center, rotation);

    const axisHandles = this._axisHandles;

    // Rotate around Z axis
    if (!axisHandles || axisHandles.includes(Communicator.Axis.Z)) {
      this._handles.push(
        new RotateHandle(this, null, 0, new Communicator.Color(255, 0, 0))
      );
    }

    // Rotate around X axis
    if (!axisHandles || axisHandles.includes(Communicator.Axis.X)) {
      this._handles.push(
        new RotateHandle(
          this,
          new Communicator.Point3(0, 1, 0),
          90,
          new Communicator.Color(0, 0, 255)
        )
      );
    }

    // Rotate around Y axis
    if (!axisHandles || axisHandles.includes(Communicator.Axis.Y)) {
      this._handles.push(
        new RotateHandle(
          this,
          new Communicator.Point3(1, 0, 0),
          90,
          new Communicator.Color(0, 200, 0)
        )
      );
    }

    // Trackball rotation
    if (!axisHandles || axisHandles.length == 3) {
      this._handles.push(
        new RotateTrackballHandle(
          this,
          new Communicator.Color(200, 200, 200),
          0.3
        )
      );
    }

    // Viewplane rotation
    this._handles.push(
      new RotateViewplaneHandle(this, new Communicator.Color(222, 222, 222))
    );

    for (let i = 0; i < this._handles.length; i++) {
      await this._handles[i].show();
    }
  }
}
