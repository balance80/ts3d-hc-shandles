import { StandardHandleGroup } from "./StandardHandleGroup.js";
import { TranslateHandle } from "../Handles/TranslateHandle.js";
import { TranslatePlaneHandle } from "../Handles/TranslatePlaneHandle.js";
import { TranslateViewplaneHandle } from "../Handles/TranslateViewplaneHandle.js";

export class TranslateHandleGroup extends StandardHandleGroup {
  constructor(manager) {
    super(manager);
  }

  async show(nodeids, center = null, rotation = null) {
    await super.show(nodeids, center, rotation);

    const axisHandles = this._axisHandles;

    // Y axis
    if (!axisHandles || axisHandles.includes(Communicator.Axis.Y)) {
      this._handles.push(
        new TranslateHandle(this, null, 0, new Communicator.Color(255, 0, 0))
      );

      this._handles.push(
        new TranslatePlaneHandle(
          this,
          new Communicator.Point3(1, 0, 0),
          -180,
          new Communicator.Color(255, 0, 0)
        )
      );
    }

    // Z axis
    if (!axisHandles || axisHandles.includes(Communicator.Axis.Z)) {
      this._handles.push(
        new TranslateHandle(
          this,
          new Communicator.Point3(1, 0, 0),
          90,
          new Communicator.Color(0, 0, 255)
        )
      );

      this._handles.push(
        new TranslatePlaneHandle(
          this,
          new Communicator.Point3(1, 0, 0),
          -180,
          new Communicator.Color(0, 0, 255),
          new Communicator.Point3(0, 1, 0),
          -90
        )
      );
    }

    // X axis
    if (!axisHandles || axisHandles.includes(Communicator.Axis.X)) {
      this._handles.push(
        new TranslateHandle(
          this,
          new Communicator.Point3(0, 0, 1),
          -90,
          new Communicator.Color(0, 200, 0)
        )
      );

      this._handles.push(
        new TranslatePlaneHandle(
          this,
          new Communicator.Point3(1, 0, 0),
          -90,
          new Communicator.Color(0, 200, 0)
        )
      );
    }

    // Viewplane handle
    if (!axisHandles || (axisHandles && axisHandles.length == 3)) {
      this._handles.push(
        new TranslateViewplaneHandle(
          this,
          new Communicator.Color(255, 255, 255)
        )
      );
    }

    for (let i = 0; i < this._handles.length; i++) {
      await this._handles[i].show();
    }
  }
}
