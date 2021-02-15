/*
 * Copyright (C) 2012-2016 InSeven Limited.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
 
(function($) {

  App.Controls = {};

  App.Controls.Pad = function(actions) {
    this.init($('#dpad-touch-target'));
    this.actions = actions;
    this.animate = true;
  };

  App.Controls.Pad.State = {
    DEFAULT:   0,
    UP:        1,
    UPRIGHT:   2,
    RIGHT:     3,
    DOWNRIGHT: 4,
    DOWN:      5,
    DOWNLEFT:  6,
    LEFT:      7,
    UPLEFT:    8
  };

  App.Controls.Pad.DIAGONAL_THRESHOLD = 30;

  jQuery.extend(
    App.Controls.Pad.prototype,
    App.Control.prototype, {

    onCreate: function() {
      var self = this;
      self.pad = $('#dpad');
      self.touches = 0;

      self.up    = false;
      self.down  = false;
      self.left  = false;
      self.right = false;

      var gamepadIndex = 0
      window.addEventListener("gamepadconnected", function(e) {
        var gp = navigator.getGamepads()[e.gamepad.index];
        gamepadIndex = gp.index
        console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
          gp.index, gp.id,
          gp.buttons.length, gp.axes.length);
      })
      console.log(navigator.getGamepads())

      var gamepadState = {
        buttons: [],
        axes: []
      }

      const buttonMap = [ "A", "B", "X", "Y", "LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_TRIGGER", "RIGHT_TRIGGER", "SELECT", "START", "LEFT_STICK", "RIGHT_STICK", "UP", "DOWN", "LEFT", "RIGHT" ]
      const axisMap = [ "LEFT_HORIZ", "LEFT_VERT", "RIGHT_HORIZ", "RIGHT_VERT" ]

      runloop = function() {
        const gamepad = navigator.getGamepads()[gamepadIndex]
        if (!gamepad || gamepad.mapping !== "standard") return

        const currentAxes = gamepadState.axes
        const axisThreshold = 0.5
        gamepad.axes.forEach(function(val, index) {
          if (currentAxes[index] !== val) {
            currentAxes[index] = val
            const axisName = axisMap[index]

            if (axisName.endsWith("VERT")) {
              if (val < -axisThreshold) {
                self.setUp(true)
              } else if (val > axisThreshold) {
                self.setDown(true)
              } else {
                self.setUp(false)
                self.setDown(false)
              }
            }
            else if (axisName.endsWith("HORIZ")) {
              if (val < -axisThreshold) {
                self.setLeft(true)
              } else if (val > axisThreshold) {
                self.setRight(true)
              } else {
                self.setLeft(false)
                self.setRight(false)
              }
            }
          }
        })

        const currentButtons = gamepadState.buttons
        gamepad.buttons.forEach(function(val, index) {
          if (currentButtons[index] !== val.pressed) {
            currentButtons[index] = val.pressed
            const buttonName = buttonMap[index]

            if (buttonName == "LEFT") self.setLeft(val.pressed)
            else if (buttonName == "RIGHT") self.setRight(val.pressed)
            else if (buttonName == "UP") self.setUp(val.pressed)
            else if (buttonName == "DOWN") self.setDown(val.pressed)

            else if (buttonName == "START") {
              if (val.pressed) {
                app.gameBoy.keyDown(Gameboy.Key.START)
              } else {
                app.gameBoy.keyUp(Gameboy.Key.START)
              }
            }
            else if (buttonName == "SELECT") {
              if (val.pressed) {
                app.gameBoy.keyDown(Gameboy.Key.SELECT)
              } else {
                app.gameBoy.keyUp(Gameboy.Key.SELECT)
              }
            }

            else if (buttonName == "A" || buttonName == "Y") {
              if (val.pressed) {
                app.gameBoy.keyDown(Gameboy.Key.A)
              } else {
                app.gameBoy.keyUp(Gameboy.Key.A)
              }
            }
            else if (buttonName == "B" || buttonName == "X") {
              if (val.pressed) {
                app.gameBoy.keyDown(Gameboy.Key.B)
              } else {
                app.gameBoy.keyUp(Gameboy.Key.B)
              }
            }
          }
        })
      }

      $(document).keydown(function(event) {
        var keycode = event.which;
        if (keycode == 37) {
          self.setLeft(true);
          event.preventDefault();
        } else if (keycode == 38) {
          self.setUp(true);
          event.preventDefault();
        } else if (keycode == 39) {
          self.setRight(true);
          event.preventDefault();
        } else if (keycode == 40) {
          self.setDown(true);
          event.preventDefault();
        }
      });
      $(document).keyup(function(event) {
        var keycode = event.which;
        if (keycode == 37) {
          self.setLeft(false);
          event.preventDefault();
        } else if (keycode == 38) {
          self.setUp(false);
          event.preventDefault();
        } else if (keycode == 39) {
          self.setRight(false);
          event.preventDefault();
        } else if (keycode == 40) {
          self.setDown(false);
          event.preventDefault();
        }
      });

    },

    width: function() {
      var self = this;
      return self.element.width();
    },

    height: function() {
      var self = this;
      return self.element.height();
    },

    onTouchEvent: function(state, position, timestamp, event) {
      var self = this;
      event.preventDefault();

      if (state === App.Control.Touch.START) {
        self.touches = 1;
        self.processTouchEvent(state, position, timestamp);
      } else if (state === App.Control.Touch.MOVE) {
        if (self.touches === 1) {
          self.processTouchEvent(state, position, timestamp);
        }
      } else if (state === App.Control.Touch.END) {
        self.setState(App.Control.State.DEFAULT);
        self.touches = 0;
      }

    },

    processTouchEvent: function(state, position, timestamp) {
      var self = this;

      var x = Math.floor(position.x / (self.element.width() / 3));
      var y = Math.floor(position.y / (self.element.width() / 3));

      switch (y) {
        case 0:
          switch (x) {
            case 0: self.setState(App.Controls.Pad.State.UPLEFT); break;
            case 1: self.setState(App.Controls.Pad.State.UP); break;
            case 2: self.setState(App.Controls.Pad.State.UPRIGHT); break;
          } break;
        case 1:
          switch (x) {
            case 0: self.setState(App.Controls.Pad.State.LEFT); break;
            case 1: self.setState(App.Controls.Pad.State.DEFAULT); break;
            case 2: self.setState(App.Controls.Pad.State.RIGHT); break;
          } break;
        case 2:
          switch (x) {
            case 0: self.setState(App.Controls.Pad.State.DOWNLEFT); break;
            case 1: self.setState(App.Controls.Pad.State.DOWN); break;
            case 2: self.setState(App.Controls.Pad.State.DOWNRIGHT); break;
          } break;
      }

    },

    setState: function(state) {
      var self = this;
      if (self.state != state) {
        self.state = state;

        switch (self.state) {
          case App.Controls.Pad.State.DEFAULT:
            self.setUp(false);
            self.setDown(false);
            self.setLeft(false);
            self.setRight(false);
            break;
          case App.Controls.Pad.State.UP:
            self.setUp(true);
            self.setDown(false);
            self.setLeft(false);
            self.setRight(false);
            break;
          case App.Controls.Pad.State.UPRIGHT:
            self.setUp(true);
            self.setDown(false);
            self.setLeft(false);
            self.setRight(true);
            break;
          case App.Controls.Pad.State.RIGHT:
            self.setUp(false);
            self.setDown(false);
            self.setLeft(false);
            self.setRight(true);
            break;
          case App.Controls.Pad.State.DOWNRIGHT:
            self.setUp(false);
            self.setDown(true);
            self.setLeft(false);
            self.setRight(true);
            break;
          case App.Controls.Pad.State.DOWN:
            self.setUp(false);
            self.setDown(true);
            self.setLeft(false);
            self.setRight(false);
            break;
          case App.Controls.Pad.State.DOWNLEFT:
            self.setUp(false);
            self.setDown(true);
            self.setLeft(true);
            self.setRight(false);
            break;
          case App.Controls.Pad.State.LEFT:
            self.setUp(false);
            self.setDown(false);
            self.setLeft(true);
            self.setRight(false);
            break;
          case App.Controls.Pad.State.UPLEFT:
            self.setUp(true);
            self.setDown(false);
            self.setLeft(true);
            self.setRight(false);
            break;
        }

      }
    },

    setUp: function(state) {
      var self = this;
      if (self.up !== state) {
        self.up = state;
        if (state) {
          self.action("touchDownUp");
        } else {
          self.action("touchUpUp");
        }
        if (self.animate !== true) {
          return;
        }
        if (state) {
          self.pad.addClass("pressed-up");
        } else {
          self.pad.removeClass("pressed-up");
        }
      }
    },

    setDown: function(state) {
      var self = this;
      if (self.down !== state) {
        self.down = state;
        if (state) {
          self.action("touchDownDown");
        } else {
          self.action("touchUpDown");
        }
        if (self.animate !== true) {
          return;
        }
        if (state) {
          self.pad.addClass("pressed-down");
        } else {
          self.pad.removeClass("pressed-down");
        }
      }
    },

    setLeft: function(state) {
      var self = this;
      if (self.left !== state) {
        self.left = state;
        if (state) {
          self.action("touchDownLeft");
        } else {
          self.action("touchUpLeft");
        }
        if (self.animate !== true) {
          return;
        }
        if (state) {
          self.pad.addClass("pressed-left");
        } else {
          self.pad.removeClass("pressed-left");
        }
      }
    },

    setRight: function(state) {
      var self = this;
      if (self.right !== state) {
        self.right = state;
        if (state) {
          self.action("touchDownRight");
        } else {
          self.action("touchUpRight");
        }
        if (self.animate !== true) {
          return;
        }
        if (state) {
          self.pad.addClass("pressed-right");
        } else {
          self.pad.removeClass("pressed-right");
        }
      }
    },

    action: function(id) {
      var self = this;
      if (id in self.actions) {
        self.actions[id]();
      }
    }

  });

})(jQuery);
