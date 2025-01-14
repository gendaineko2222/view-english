/**
 * Push
 * =======
 * A compact, cross-browser solution for the JavaScript Notifications API
 *
 * Credits
 * -------
 * Tsvetan Tsvetkov (ttsvetko)
 * Alex Gibson (alexgibson)
 *
 * License
 * -------
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Tyler Nickerson
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @preserve
 */
(function(global, factory) {
  "use strict";
  if (typeof define === "function" && define.amd) {
    define(function() {
      return new(factory(global, global.document))
    })
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports = new(factory(global, global.document))
  } else {
    global.Push = new(factory(global, global.document))
  }
})(typeof window !== "undefined" ? window : this, function(w, d) {
  var Push = function() {
    var self = this,
      isUndefined = function(obj) {
        return obj === undefined
      },
      isString = function(obj) {
        return String(obj) === obj
      },
      isFunction = function(obj) {
        return obj && {}.toString.call(obj) === "[object Function]"
      },
      currentId = 0,
      incompatibilityErrorMessage = "PushError: push.js is incompatible with browser.",
      hasPermission = false,
      notifications = {},
      lastWorkerPath = null,
      closeNotification = function(id) {
        var errored = false,
          notification = notifications[id];
        if (typeof notification !== "undefined") {
          if (notification.close) {
            notification.close()
          } else if (notification.cancel) {
            notification.cancel()
          } else if (w.external && w.external.msIsSiteMode) {
            w.external.msSiteModeClearIconOverlay()
          } else {
            errored = true;
            throw new Error("Unable to close notification: unknown interface")
          }
          if (!errored) {
            return removeNotification(id)
          }
        }
        return false
      },
      addNotification = function(notification) {
        var id = currentId;
        notifications[id] = notification;
        currentId++;
        return id
      },
      removeNotification = function(id) {
        var dict = {},
          success = false,
          key;
        for (key in notifications) {
          if (notifications.hasOwnProperty(key)) {
            if (key != id) {
              dict[key] = notifications[key]
            } else {
              success = true
            }
          }
        }
        notifications = dict;
        return success
      },
      createCallback = function(title, options) {
        var notification, wrapper, id, onClose;
        options = options || {};
        self.lastWorkerPath = options.serviceWorker || "sw.js";
        if (w.Notification) {
          try {
            notification = new w.Notification(title, {
              icon: isString(options.icon) || isUndefined(options.icon) ? options.icon : options.icon.x32,
              body: options.body,
              tag: options.tag,
              requireInteraction: options.requireInteraction
            })
          } catch (e) {
            if (w.navigator) {
              w.navigator.serviceWorker.register(options.serviceWorker || "sw.js");
              w.navigator.serviceWorker.ready.then(function(registration) {
                registration.showNotification(title, {
                  body: options.body,
                  vibrate: options.vibrate,
                  tag: options.tag,
                  requireInteraction: options.requireInteraction
                })
              })
            }
          }
        } else if (w.webkitNotifications) {
          notification = w.webkitNotifications.createNotification(options.icon, title, options.body);
          notification.show()
        } else if (navigator.mozNotification) {
          notification = navigator.mozNotification.createNotification(title, options.body, options.icon);
          notification.show()
        } else if (w.external && w.external.msIsSiteMode()) {
          w.external.msSiteModeClearIconOverlay();
          w.external.msSiteModeSetIconOverlay(isString(options.icon) || isUndefined(options.icon) ? options.icon : options.icon.x16, title);
          w.external.msSiteModeActivate();
          notification = {}
        } else {
          throw new Error("Unable to create notification: unknown interface")
        }
        id = addNotification(notification);
        wrapper = {
          get: function() {
            return notification
          },
          close: function() {
            closeNotification(id)
          }
        };
        if (options.timeout) {
          setTimeout(function() {
            wrapper.close()
          }, options.timeout)
        }
        if (isFunction(options.onShow)) notification.addEventListener("show", options.onShow);
        if (isFunction(options.onError)) notification.addEventListener("error", options.onError);
        if (isFunction(options.onClick)) notification.addEventListener("click", options.onClick);
        onClose = function() {
          removeNotification(id);
          if (isFunction(options.onClose)) {
            options.onClose.call(this)
          }
        };
        notification.addEventListener("close", onClose);
        notification.addEventListener("cancel", onClose);
        return wrapper
      },
      Permission = {
        DEFAULT: "default",
        GRANTED: "granted",
        DENIED: "denied"
      },
      Permissions = [Permission.GRANTED, Permission.DEFAULT, Permission.DENIED];
    self.Permission = Permission;
    self.Permission.request = function(onGranted, onDenied) {
      if (!self.isSupported) {
        throw new Error(incompatibilityErrorMessage)
      }
      callback = function(result) {
        switch (result) {
          case self.Permission.GRANTED:
            hasPermission = true;
            if (onGranted) onGranted();
            break;
          case self.Permission.DENIED:
            hasPermission = false;
            if (onDenied) onDenied();
            break
        }
      };
      if (w.Notification && w.Notification.requestPermission) {
        Notification.requestPermission(callback)
      } else if (w.webkitNotifications && w.webkitNotifications.checkPermission) {
        w.webkitNotifications.requestPermission(callback)
      } else {
        throw new Error(incompatibilityErrorMessage)
      }
    };
    self.Permission.has = function() {
      return hasPermission
    };
    self.Permission.get = function() {
      var permission;
      if (!self.isSupported) {
        throw new Error(incompatibilityErrorMessage)
      }
      if (w.Notification && w.Notification.permissionLevel) {
        permission = w.Notification.permissionLevel
      } else if (w.webkitNotifications && w.webkitNotifications.checkPermission) {
        permission = Permissions[w.webkitNotifications.checkPermission()]
      } else if (w.Notification && w.Notification.permission) {
        permission = w.Notification.permission
      } else if (navigator.mozNotification) {
        permission = Permissions.GRANTED
      } else if (w.external && w.external.msIsSiteMode() !== undefined) {
        permission = w.external.msIsSiteMode() ? Permission.GRANTED : Permission.DEFAULT
      } else {
        throw new Error(incompatibilityErrorMessage)
      }
      return permission
    };
    self.isSupported = function() {
      var isSupported = false;
      try {
        isSupported = !!(w.Notification || w.webkitNotifications || navigator.mozNotification || w.external && w.external.msIsSiteMode() !== undefined)
      } catch (e) {}
      return isSupported
    }();
    self.create = function(title, options) {
      if (!self.isSupported) {
        throw new Error(incompatibilityErrorMessage)
      }
      if (!isString(title)) {
        throw new Error("PushError: Title of notification must be a string")
      }
      if (!self.Permission.has()) {
        return new Promise(function(resolve, reject) {
          self.Permission.request(function() {
            try {
              resolve(createCallback(title, options))
            } catch (e) {
              reject(e)
            }
          }, function() {
            reject("Permission request declined")
          })
        })
      } else {
        return new Promise(function(resolve, reject) {
          try {
            resolve(createCallback(title, options))
          } catch (e) {
            reject(e)
          }
        })
      }
    };
    self.count = function() {
      var count = 0,
        key;
      for (key in notifications) {
        count++
      }
      return count
    }, self.__lastWorkerPath = function() {
      return self.lastWorkerPath
    }, self.close = function(tag) {
      var key;
      for (key in notifications) {
        notification = notifications[key];
        if (notification.tag === tag) {
          return closeNotification(key)
        }
      }
    };
    self.clear = function() {
      var i, success = true;
      for (key in notifications) {
        var didClose = closeNotification(key);
        success = success && didClose
      }
      return success
    }
  };
  return Push
});
