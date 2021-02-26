var Charts = (function () {
  'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }

    return object;
  }

  function _get(target, property, receiver) {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get;
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);

        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);

        if (desc.get) {
          return desc.get.call(receiver);
        }

        return desc.value;
      };
    }

    return _get(target, property, receiver || target);
  }

  Number.isInteger = Number.isInteger || function (value) {
    return typeof value === 'number' && Number.isFinite(value) && !(value % 1);
  };

  var Emmiter =
  /*#__PURE__*/
  function () {
    function Emmiter() {
      _classCallCheck(this, Emmiter);

      this._listeners = {};
    }

    _createClass(Emmiter, [{
      key: "on",
      value: function on(event, listener) {
        var _this = this;

        var listeners = this._listeners;
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(listener);
        return function () {
          return _this.off(event, listener);
        };
      }
    }, {
      key: "once",
      value: function once(event, listener) {
        var remove = this.on(event, function () {
          remove();
          listener.apply(this, arguments);
        });
      }
    }, {
      key: "emit",
      value: function emit(event) {
        var eventListeners = this._listeners[event];
        if (!eventListeners) return; // Get function arguments without "event" parameter

        var args = [].slice.call(arguments, 1); // SLice need to normal handle once events with instantly off event

        var listeners = eventListeners.slice();
        listeners.forEach(function (listener) {
          listener.apply(null, args);
        });
      }
    }, {
      key: "off",
      value: function off(event, listener) {
        if (!this._listeners[event]) return;

        var idx = this._listeners[event].indexOf(listener);

        if (idx > -1) {
          this._listeners[event].splice(idx, 1);
        }
      }
    }]);

    return Emmiter;
  }();

  var dataEmmiter = new Emmiter();

  var loadOverview = function loadOverview(data, callback) {
    var result = {};
    var lost = data.length;
    data.forEach(function (dataElem) {
      // Load chart data
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'data/' + dataElem.path + '.json', true);
      xhr.send();

      xhr.onreadystatechange = function () {
        if (xhr.readyState != 4 || xhr.status != 200) return;
        result[dataElem.id] = JSON.parse(xhr.responseText);
        lost--;
        if (lost == 0) callback(result);
      };
    });
  };

  var inLoading = {};
  var subCache = {};

  var loadSub = function loadSub(data) {
    if (subCache[data.id]) {
      dataEmmiter.emit('loaded' + data.id, subCache[data.id]);
      return;
    }

    if (inLoading[data.id]) return;
    inLoading[data.id] = true; // Load chart data

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/' + data.path + '.json', true);
    xhr.send();

    xhr.onreadystatechange = function () {
      if (xhr.readyState != 4 || xhr.status != 200) return;
      var parsedData = JSON.parse(xhr.responseText);
      subCache[data.id] = parsedData;
      delete inLoading[data.id];
      dataEmmiter.emit('loaded' + data.id, parsedData);
    };
  };

  var Data =
  /*#__PURE__*/
  function () {
    function Data(globalEmmiter) {
      _classCallCheck(this, Data);
    }

    _createClass(Data, [{
      key: "getOverview",
      value: function getOverview(callback) {
        var overviewsLoad = [];

        for (var i = 1; i < 6; i++) {
          overviewsLoad.push({
            id: 'overview' + i,
            path: i + '/overview'
          });
        }

        loadOverview(overviewsLoad, function (overviews) {
          var result = Object.keys(overviews).sort(function (a, b) {
            if (a == 'overview4') return 1;
            if (b == 'overview4') return -1;
            if (a < b) return -1;
            if (b < a) return 1;
            return 0;
          }).map(function (id) {
            var overview = overviews[id];

            if (overview.y_scaled) {
              overview._type = 'lines_scaled';
              overview._title = 'Interactions';
            } else if (overview.stacked && overview.percentage) {
              overview._type = 'percents';
              overview._title = 'Fruits';
            } else if (overview.stacked) {
              overview._type = 'bars';
              overview._title = 'Fruits';
            } else if (overview.types.y0 == 'bar') {
              overview._type = 'bars_single';
              overview._title = 'Views';
            } else {
              overview._type = 'lines';
              overview._title = 'Followers';
            }

            return overview;
          });
          callback(result);
        });
      }
    }, {
      key: "getSub",
      value: function getSub(type, timestamp, callback) {
        var typeId = 0;
        if (type == 'lines') typeId = 1;
        if (type == 'lines_scaled') typeId = 2;
        if (type == 'bars') typeId = 3;
        if (type == 'bars_single') typeId = 4;
        if (type == 'percents') typeId = 5;
        var date = new Date(timestamp);
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        if (month < 10) month = '0' + month;
        var day = date.getDate();
        if (day < 10) day = '0' + day;
        var loadSubData = {
          id: 'overview' + typeId + ':sub' + year + '-' + month + '-' + day,
          path: typeId + '/' + year + '-' + month + '/' + day
        };
        dataEmmiter.once('loaded' + loadSubData.id, function (subData) {
          if (callback) callback(subData);
        });
        loadSub(loadSubData);
      }
    }]);

    return Data;
  }();

  var TextSwitcher =
  /*#__PURE__*/
  function () {
    function TextSwitcher(options) {
      _classCallCheck(this, TextSwitcher);

      var $dom = document.createElement('div');
      $dom.className = 'switcher' + (options.isRight ? ' switcher__right' : '') + (options.isLeft ? ' switcher__left' : '');
      this.$dom = $dom;

      if (options.text) {
        var $elem = document.createElement('div');
        $dom.appendChild($elem);
        this.$elem = $elem;
        if (typeof options.text == 'string') $elem.innerHTML = options.text;else $elem.appendChild(options.text);
        this.updateWidth();
      }

      this.isRemoving = false;
    }

    _createClass(TextSwitcher, [{
      key: "set",
      value: function set(text) {
        if (!this.$elem) {
          var $elem = document.createElement('div');
          this.$dom.appendChild($elem);
          this.$elem = $elem;
        }

        if (typeof text == 'string') this.$elem.innerHTML = text;else {
          this.$elem.innerHTML = '';
          this.$elem.appendChild(text);
        }
        this.updateWidth();
      }
    }, {
      key: "change",
      value: function change(text, isUp) {
        var _this = this;

        if (this.isRemoving) {
          if (typeof text == 'string') this.$elem.innerHTML = text;else {
            this.$elem.innerHTML = '';
            this.$elem.appendChild(text);
          }
          this.updateWidth();
          return;
        }

        var $prevElem = this.$elem;

        if (!$prevElem) {
          var _$elem = document.createElement('div');

          _$elem.innerHTML = text;
          this.$dom.appendChild(_$elem);
          this.$elem = _$elem;
          if (typeof text == 'string') _$elem.innerHTML = text;else _$elem.appendChild(text);
          this.updateWidth();
          return;
        }

        $prevElem.classList.add(isUp ? 'switcher__hide-bottom' : 'switcher__hide-top');
        this.isRemoving = true;
        setTimeout(function () {
          _this.$dom.removeChild($prevElem);

          _this.isRemoving = false;
        }, 175);
        var $elem = document.createElement('div');
        $elem.className = isUp ? 'switcher__hide-top' : 'switcher__hide-bottom';
        this.$dom.appendChild($elem);
        this.$elem = $elem;
        if (typeof text == 'string') $elem.innerHTML = text;else $elem.appendChild(text);
        this.updateWidth();
        setTimeout(function () {
          $elem.className = '';
        }, 25);
      }
    }, {
      key: "updateWidth",
      value: function updateWidth(diff) {
        var _this2 = this;

        if (!diff) diff = 0;
        setTimeout(function () {
          _this2.$dom.style.width = _this2.$elem.offsetWidth + diff + 'px';
        }, 0);
      }
    }]);

    return TextSwitcher;
  }();

  var Header = function Header(globalEmmiter) {
    _classCallCheck(this, Header);

    var isDarkTheme = false;
    var switchLightText = 'Night Mode';
    var switchDarkText = 'Day Mode';
    var $dom = document.createElement('div');
    this.$dom = $dom;
    $dom.className = 'header';
    $dom.innerHTML = '<div class="header_title">Statistics</div>' + '<a href="#" class="link"></a>';
    var $switch = $dom.querySelector('.link');
    var textSwitcher = new TextSwitcher({
      text: switchLightText,
      isRight: true
    });
    $switch.appendChild(textSwitcher.$dom);
    $switch.addEventListener('click', function (e) {
      e.preventDefault();
      isDarkTheme = !isDarkTheme;
      textSwitcher.change(isDarkTheme ? switchDarkText : switchLightText, isDarkTheme);
      globalEmmiter.emit('theme-change', isDarkTheme);
    });
  };

  var colorsNames = {};
  var colors = [];
  var animationDuration = 300;
  var animationTime = animationDuration;
  var nextTickDisableChanging = false;

  var hexToRgb = function hexToRgb(hex) {
    var hexNumber = parseInt(hex, 16);
    var r = hexNumber >> 16 & 255;
    var g = hexNumber >> 8 & 255;
    var b = hexNumber & 255;
    return [r, g, b];
  };

  var Color =
  /*#__PURE__*/
  function () {
    function Color(light, dark) {
      _classCallCheck(this, Color);

      this.partsCount = light.length;
      this.light = light;
      this.dark = dark;
      this.current = light;
      this.target = light;
      var step = dark.map(function (part, i) {
        return (part - light[i]) / animationDuration;
      });
      this.stepToDark = step;
      this.step = step;
      this.setCurrent();
    }

    _createClass(Color, [{
      key: "changeTheme",
      value: function changeTheme(isDark) {
        if (isDark) this.step = this.stepToDark;else this.step = this.stepToDark.map(function (part) {
          return -part;
        });
        this.target = isDark ? this.dark : this.light;
      }
    }, {
      key: "update",
      value: function update(delta) {
        var _this = this;

        this.current = this.current.map(function (value, i) {
          if (i == 3) return parseFloat((value + _this.step[i] * delta).toFixed(2));
          return parseInt(value + _this.step[i] * delta);
        });
        this.setCurrent();
      }
    }, {
      key: "finish",
      value: function finish() {
        this.current = this.target;
        this.setCurrent();
      }
    }, {
      key: "setCurrent",
      value: function setCurrent() {
        var parts = this.current.join(',');
        this.parts = parts;
        if (this.partsCount == 3) this.value = 'rgb(' + parts + ')';
        if (this.partsCount == 4) this.value = 'rgba(' + parts + ')';
      }
    }]);

    return Color;
  }();

  var Colors = {
    isChanging: false,
    isChanged: false,
    add: function add(name, light, dark) {
      if (typeof light == 'string') light = hexToRgb(light);
      if (typeof dark == 'string') dark = hexToRgb(dark);

      if (_typeof(light) == 'object' && light.length == 2) {
        var opacity = light[1];
        light = hexToRgb(light[0]);
        light.push(opacity);
      }

      if (_typeof(dark) == 'object' && dark.length == 2) {
        var _opacity = dark[1];
        dark = hexToRgb(dark[0]);
        dark.push(_opacity);
      }

      colorsNames[name] = colors.length;
      colors.push(new Color(light, dark));
    },
    get: function get(name) {
      return colors[colorsNames[name]];
    },
    changeTheme: function changeTheme(isDark) {
      colors.forEach(function (color) {
        color.changeTheme(isDark);
      });
      this.isChanging = true;
      animationTime = animationDuration - animationTime;
    },
    update: function update(delta) {
      if (nextTickDisableChanging) {
        nextTickDisableChanging = false;
        this.isChanging = false;
        this.isChanged = false;
        return;
      }

      animationTime += delta;

      if (animationTime >= animationDuration) {
        animationTime = animationDuration;
        colors.forEach(function (color) {
          color.finish();
        });
        nextTickDisableChanging = true;
        this.isChanged = true;
        return;
      }

      colors.forEach(function (color) {
        color.update(delta);
      });
    }
  }; // Background color

  Colors.add('BACKGROUND', 'FFFFFF', '242F3E'); // Text color

  Colors.add('TEXT', '000000', 'FFFFFF'); // Axis line color

  Colors.add('AXIS_LINE', ['182D3B', 0.1], ['FFFFFF', 0.1]); // Default axis label color

  Colors.add('AXIS_LABEL', ['8E8E93', 1], ['A3B1C2', 0.6]); // Tooltip mask for bars chart

  Colors.add('TOOLTIP_MASK', ['FFFFFF', 0.5], ['242F3E', 0.5]); // Alternative axis labels color

  Colors.add('AXIS_LABEL_ALT_X', ['252529', 0.5], ['A3B1C2', 0.6]);
  Colors.add('AXIS_LABEL_ALT_Y', ['252529', 0.5], ['ECF2F8', 0.5]); // Followers, Interactions, Growth - Red

  Colors.add('#FE3C30:line', 'FE3C30', 'E6574F');
  Colors.add('#FE3C30:button', 'E65850', 'CF5D57');
  Colors.add('#FE3C30:tooltip', 'F34C44', 'F7655E'); // Followers, Interactions, Growth - Green

  Colors.add('#4BD964:line', '4BD964', '4BD964');
  Colors.add('#4BD964:button', '5FB641', '5AB34D');
  Colors.add('#4BD964:tooltip', '3CC23F', '4BD964'); // Followers, Interactions, Growth - Blue

  Colors.add('#108BE3:line', '108BE3', '108BE3');
  Colors.add('#108BE3:button', '3497ED', '4681BB');
  Colors.add('#108BE3:tooltip', '108BE3', '108BE3'); // Followers, Interactions, Growth - Yellow

  Colors.add('#E8AF14:line', 'E8AF14', 'DEB93F');
  Colors.add('#E8AF14:button', 'F5BD25', 'C9AF4F');
  Colors.add('#E8AF14:tooltip', 'E4AE1B', 'DEB93F'); // Onlines - Blue

  Colors.add('#64ADED:line', '64ADED', '4082CE');
  Colors.add('#64ADED:button', '3896E8', '4082CE');
  Colors.add('#64ADED:tooltip', '3896E8', '4082CE'); // Onlines - Dark Blue

  Colors.add('#558DED:line', '558DED', '4461AB');
  Colors.add('#558DED:button', '558DED', '4461AB');
  Colors.add('#558DED:tooltip', '558DED', '4461AB'); // Onlines - Light Blue

  Colors.add('#5CBCDF:line', '5CBCDF', '4697B3');
  Colors.add('#5CBCDF:button', '5CBCDF', '4697B3');
  Colors.add('#5CBCDF:tooltip', '5CBCDF', '4697B3'); // Messages, Apps - Blue

  Colors.add('#3497ED:line', '3497ED', '4681BB');
  Colors.add('#3497ED:button', '3497ED', '4681BB');
  Colors.add('#3497ED:tooltip', '108BE3', '5199DF'); // Messages, Apps - Dark Blue

  Colors.add('#2373DB:line', '2373DB', '345B9C');
  Colors.add('#2373DB:button', '3381E8', '466FB3');
  Colors.add('#2373DB:tooltip', '2373DB', '3E65CF'); // Messages, Apps - Light Green

  Colors.add('#9ED448:line', '9ED448', '88BA52');
  Colors.add('#9ED448:button', '9ED448', '88BA52');
  Colors.add('#9ED448:tooltip', '89C32E', '99CF60'); // Messages, Apps - Green

  Colors.add('#5FB641:line', '5FB641', '3DA05A');
  Colors.add('#5FB641:button', '5FB641', '3DA05A');
  Colors.add('#5FB641:tooltip', '4BAB29', '3CB560'); // Messages, Apps - Yellow

  Colors.add('#F5BD25:line', 'F5BD25', 'D9B856');
  Colors.add('#F5BD25:button', 'F5BD25', 'F5BD25');
  Colors.add('#F5BD25:tooltip', 'EAAF10', 'DBB630'); // Messages, Apps - Orange

  Colors.add('#F79E39:line', 'F79E39', 'D49548');
  Colors.add('#F79E39:button', 'F79E39', 'D49548');
  Colors.add('#F79E39:tooltip', 'F58608', 'EE9D39'); // Messages, Apps - Red

  Colors.add('#E65850:line', 'E65850', 'CF5D57');
  Colors.add('#E65850:button', 'E65850', 'CF5D57');
  Colors.add('#E65850:tooltip', 'F34C44', 'F7655E');

  var detectMobile = function detectMobile() {
    var userAgent = navigator.userAgent;

    if (userAgent.match(/Android/i) || userAgent.match(/webOS/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPad/i) || userAgent.match(/iPod/i) || userAgent.match(/BlackBerry/i) || userAgent.match(/Windows Phone/i)) {
      return true;
    } else return false;
  };

  var fullMonthsNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  var formatDate = function formatDate(unixMs, addDay) {
    var date = new Date(unixMs);
    var dateString = '';

    if (addDay) {
      if (window.innerWidth > 400) dateString += fullDays[date.getDay()];else dateString += date.toDateString().split(' ')[0];
      dateString += ', ';
    }

    dateString += date.getDate(); // Add short month name if device width small

    if (window.innerWidth > 400) {
      dateString += ' ' + fullMonthsNames[date.getMonth()];
    } else dateString += ' ' + date.toDateString().split(' ')[1];

    dateString += ' ' + date.getFullYear();
    return dateString;
  };

  var generateRangeText = function generateRangeText(start, end) {
    if (end - start < 86400000 * 1.5) {
      return formatDate(start + (end - start) / 2, true);
    }

    var rangeText = '';
    var startDate = formatDate(start);
    var endDate = formatDate(end);
    if (startDate == endDate) rangeText = startDate;else rangeText = startDate + ' - ' + endDate;
    return rangeText;
  };

  var handleInputData = function handleInputData(sourceData) {
    var columns = sourceData.columns.reduce(function (result, column) {
      result[column[0]] = column.slice(1);
      return result;
    }, {});
    return Object.keys(sourceData.types).reduce(function (result, id) {
      var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

      if (sourceData.types[id] == 'x') {
        result.x = columns[id].map(function (value) {
          return value + timezoneOffset;
        });
        return result;
      }

      if (!result.lines) result.lines = [];
      result.lines.push({
        id: id,
        name: sourceData.names[id],
        color: sourceData.colors[id],
        column: columns[id]
      });
      return result;
    }, {});
  };

  var shortFormatValue = function shortFormatValue(value, maxValue) {
    var labelOrigValue = value;
    var labelValue = '';

    if (maxValue > 100 * 1000000) {
      labelValue = (labelOrigValue / 1000000).toFixed(0) + 'M';
    } else if (maxValue > 1000000) {
      labelValue = (labelOrigValue / 1000000).toFixed(1) + 'M';
    } else if (maxValue > 100 * 1000) {
      labelValue = (labelOrigValue / 1000).toFixed(0) + 'K';
    } else if (maxValue > 1000) {
      labelValue = (labelOrigValue / 1000).toFixed(1) + 'K';
    } else {
      labelValue = parseInt(labelOrigValue.toFixed(0)).toLocaleString('ru-RU');
    }

    if (labelValue == '0M' || labelValue == '0.0M' || labelValue == '0K' || labelValue == '0.0K') labelValue = '0';
    return labelValue;
  };

  var isAnyPartOfElementInViewport = function isAnyPartOfElementInViewport(el) {
    var rect = el.getBoundingClientRect();
    var windowHeight = window.innerHeight || document.documentElement.clientHeight;
    var windowWidth = window.innerWidth || document.documentElement.clientWidth;
    var vertInView = rect.top <= windowHeight && rect.top + rect.height >= 0;
    var horInView = rect.left <= windowWidth && rect.left + rect.width >= 0;
    return vertInView && horInView;
  };

  var LegendElement =
  /*#__PURE__*/
  function () {
    function LegendElement(options) {
      var _this = this;

      _classCallCheck(this, LegendElement);

      this.isActive = true;
      this.isDarkTheme = false;
      this.line = options.line;
      this.containerEmmiter = options.containerEmmiter;
      var color = Colors.get(options.line.color + ':button');
      this.lightColor = 'rgb(' + color.light.join(',') + ')';
      this.darkColor = 'rgb(' + color.dark.join(',') + ')';
      var $dom = document.createElement('div');
      this.$dom = $dom;
      $dom.className = 'legend-element legend-element__active';
      $dom.innerHTML = '<div class="legend-element_checkbox">' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14.5 12.5">' + '<path d="M1.5 7.5L5 10.5L12.5 2" fill="none" stroke="#fff"' + ' stroke-width="2.2" stroke-linecap="round"' + ' stroke-linejoin="round"></path>' + '</svg>' + '</div>' + '<div class="legend-element_text">' + options.line.name + '</div>';
      this.changeColors();
      this.legend = options.legend;
      this.$checkbox = $dom.querySelector('.legend-element_checkbox');
      this.$text = $dom.querySelector('.legend-element_text');
      this.isAnimating = false;
      var hideOtherTimeout = null;
      var isHideOtherFired = false;

      var downHandler = function downHandler() {
        isHideOtherFired = false;
        hideOtherTimeout = setTimeout(function () {
          isHideOtherFired = true;

          _this.legend.hideAllExcept(_this);
        }, 300);
      };

      var upHandler = function upHandler(e) {
        e.preventDefault();
        if (isHideOtherFired) return;
        clearTimeout(hideOtherTimeout);

        _this.toggle();
      };

      $dom.addEventListener('mousedown', downHandler);
      $dom.addEventListener('touchstart', downHandler);
      $dom.addEventListener('mouseup', upHandler);
      $dom.addEventListener('touchend', upHandler);
      options.globalEmmiter.on('theme-change', function (isDarkTheme) {
        _this.isDarkTheme = isDarkTheme;

        _this.changeColors();
      });
    }

    _createClass(LegendElement, [{
      key: "changeColors",
      value: function changeColors() {
        var $dom = this.$dom;
        var color = this.isDarkTheme ? this.darkColor : this.lightColor;
        $dom.style.borderColor = color;
        $dom.style.backgroundColor = this.isActive ? color : 'transparent';
        $dom.style.color = this.isActive ? '#fff' : color;
      }
    }, {
      key: "toggle",
      value: function toggle() {
        var _this2 = this;

        if (this.isActive && this.legend.activedCount == 1) {
          if (this.isAnimating) return;
          this.isAnimating = true;
          this.$dom.style.animationName = 'legend-shake';
          this.$checkbox.style.animationName = 'legend-shake-inner';
          this.$text.style.animationName = 'legend-shake-inner';
          setTimeout(function () {
            _this2.isAnimating = false;
            _this2.$dom.style.animationName = null;
            _this2.$checkbox.style.animationName = null;
            _this2.$text.style.animationName = null;
          }, 400);
          return;
        }

        this.isActive = !this.isActive;
        this.$dom.classList.toggle('legend-element__active');
        this.changeColors();
        if (this.isActive) this.legend.activedCount++;else this.legend.activedCount--;
        this.containerEmmiter.emit('line-toggle', this.line.id, this.isActive);
      }
    }]);

    return LegendElement;
  }();

  var Legend =
  /*#__PURE__*/
  function () {
    function Legend(options) {
      var _this3 = this;

      _classCallCheck(this, Legend);

      var $dom = document.createElement('div');
      $dom.className = 'legend';
      this.$dom = $dom;
      var lines = options.data.lines;
      this.activedCount = lines.length;
      this.legendElements = lines.map(function (line) {
        var legendElement = new LegendElement({
          line: line,
          legend: _this3,
          containerEmmiter: options.containerEmmiter,
          globalEmmiter: options.globalEmmiter
        });
        $dom.appendChild(legendElement.$dom);
        return legendElement;
      });
    }

    _createClass(Legend, [{
      key: "hideAllExcept",
      value: function hideAllExcept(exceptElement) {
        if (!exceptElement.isActive || this.activedCount == 1) exceptElement.toggle();
        this.legendElements.forEach(function (element) {
          if (element == exceptElement || !element.isActive) return;
          element.toggle();
        });
      }
    }]);

    return Legend;
  }();

  var MapOverlay =
  /*#__PURE__*/
  function () {
    function MapOverlay(options) {
      var _this = this;

      _classCallCheck(this, MapOverlay);

      this.width = 0;
      this.start = 0;
      this.long = 0;
      var $dom = document.createElement('div');
      $dom.className = 'map-overlay';
      this.$dom = $dom;
      var $leftOverlay = document.createElement('div');
      $leftOverlay.className = 'map-overlay_elem';
      $dom.appendChild($leftOverlay);
      this.$leftOverlay = $leftOverlay;
      var $rightOverlay = document.createElement('div');
      $rightOverlay.className = 'map-overlay_elem';
      $dom.appendChild($rightOverlay);
      this.$rightOverlay = $rightOverlay;
      options.containerEmmiter.on('viewport-change', function (start, long) {
        _this.start = start;
        _this.long = long;

        _this.calculateViewport();
      });
    }

    _createClass(MapOverlay, [{
      key: "setWidth",
      value: function setWidth(width) {
        this.width = width;
        this.calculateViewport();
      }
    }, {
      key: "calculateViewport",
      value: function calculateViewport() {
        this.$leftOverlay.style.transform = 'translateX(' + ((this.start - 1) * this.width + 8) + 'px)';
        this.$rightOverlay.style.transform = 'translateX(' + ((this.start + this.long) * this.width - 8) + 'px)';
      }
    }]);

    return MapOverlay;
  }();

  var MapViewbox =
  /*#__PURE__*/
  function () {
    function MapViewbox(options) {
      var _this = this;

      _classCallCheck(this, MapViewbox);

      var containerEmmiter = options.containerEmmiter;
      this.containerEmmiter = containerEmmiter;
      this.width = 0;
      this.start = 0;
      this.long = 0;
      this.handledControl = 0;
      this.prevLeft = 0;
      this.prevRight = 0;
      var $dom = document.createElement('div');
      $dom.className = 'map-viewbox';
      $dom.innerHTML = '<div class="map-viewbox_left"></div>' + '<div class="map-viewbox_right"></div>';
      this.$dom = $dom;
      this.$left = $dom.querySelector('.map-viewbox_left');
      this.$right = $dom.querySelector('.map-viewbox_right');
      containerEmmiter.on('viewport-change', function (start, long) {
        _this.start = start;
        _this.long = long;

        _this.calculateViewport();
      });
      containerEmmiter.emit('viewport-change', 0.75, 0.25); //
      // Desktop
      //

      $dom.addEventListener('mousedown', this.handleStart.bind(this));
      document.body.addEventListener('mousemove', this.handleMove.bind(this));
      document.body.addEventListener('mouseup', this.handleEnd.bind(this));
      document.body.addEventListener('mouseleave', this.handleEnd.bind(this)); //
      // Mobile
      //

      document.body.addEventListener('touchend', this.handleEnd.bind(this));
      var startTouchX = 0;
      var startTouchY = 0;
      var touchShowTimeout = 0;
      var started = false;
      var disabled = false;
      this.$dom.addEventListener('touchstart', function (e) {
        startTouchX = e.touches[0].pageX;
        startTouchY = e.touches[0].pageY;
        started = false;
        disabled = false;
        touchShowTimeout = setTimeout(function () {
          started = true;

          _this.handleStart(e);
        }, 300);
      });
      this.$dom.addEventListener('touchmove', function (e) {
        if (disabled) return;
        var touchX = e.touches[0].pageX;

        if (!started) {
          clearTimeout(touchShowTimeout);
          var touchY = e.touches[0].pageY;
          var lengthX = Math.abs(touchX - startTouchX);
          var lengthY = Math.abs(touchY - startTouchY);

          if (lengthY > lengthX) {
            disabled = true;
            return;
          }

          started = true;

          _this.handleStart(e);
        }

        e.preventDefault();

        _this.handleMove(e);
      });
    }

    _createClass(MapViewbox, [{
      key: "setWidth",
      value: function setWidth(width) {
        this.width = width;
        this.calculateViewport();
      }
    }, {
      key: "calculateViewport",
      value: function calculateViewport() {
        var left = this.start * this.width + 18;
        var right = this.width - (left + this.long * this.width - 36);

        if (left != this.prevLeft) {
          this.prevLeft = left;
          this.$dom.style.left = left + 'px';
        }

        if (right != this.prevRight) {
          this.prevRight = right;
          this.$dom.style.right = right + 'px';
        }
      }
    }, {
      key: "handleStart",
      value: function handleStart(e) {
        var x = 0;

        if (e.type == 'mousedown') {
          x = e.pageX;
        } else {
          x = e.touches[0].pageX;
        }

        var handledControl = 0; // Move viewbox

        if (e.target == this.$dom) {
          handledControl = 1;
          this.dragX = x - this.start * this.width;
        }

        if (e.target == this.$left) {
          handledControl = 2;
          this.dragX = x - this.start * this.width;
        }

        if (e.target == this.$right) {
          handledControl = 3;
          this.dragX = x - (this.start + this.long) * this.width;
        }

        if (handledControl != 0) {
          this.prevX = x;
          this.handledControl = handledControl;
          this.containerEmmiter.emit('viewport-start');
        }
      }
    }, {
      key: "handleMove",
      value: function handleMove(e) {
        if (this.handledControl == 0) return;
        e.preventDefault();
        var x = 0;

        if (e.type == 'mousemove') {
          x = e.pageX;
        } else {
          x = e.touches[0].pageX;
        }

        var percDelta = (x - this.prevX) / this.width;
        this.prevX = x;

        if (this.handledControl == 1) {
          this.start += percDelta;

          if (this.start < 0) {
            this.start = 0;
            this.prevX = this.start * this.width + this.dragX;
          }

          var end = this.start + this.long;

          if (end > 1) {
            var delta = end - 1;
            this.start -= delta;
            this.prevX = this.start * this.width + this.dragX;
          }
        }

        if (this.handledControl == 2) {
          this.start += percDelta;
          this.long -= percDelta;

          if (this.start < 0) {
            var _delta = this.start;
            this.start = 0;
            this.long += _delta;
            this.prevX = this.start * this.width + this.dragX;
          }

          var minLong = 44 / this.width;

          if (this.long < minLong) {
            var _delta2 = minLong - this.long;

            this.long = minLong;
            this.start -= _delta2;
            this.prevX = this.start * this.width + this.dragX;
          }
        }

        if (this.handledControl == 3) {
          this.long += percDelta;

          var _end = this.start + this.long;

          if (_end > 1) {
            var _delta3 = 1 - _end;

            this.long += _delta3;
            this.prevX = _end * this.width + this.dragX;
          }

          var _minLong = 44 / this.width;

          if (this.long < _minLong) {
            var _delta4 = _minLong - this.long;

            this.long = _minLong;
            _end += _delta4;
            this.prevX = _end * this.width + this.dragX;
          }
        }

        if (this.prevStart != this.start || this.prevLong != this.long) {
          this.calculateViewport();
          this.containerEmmiter.emit('viewport-change', this.start, this.long);
        }

        this.prevStart = this.start;
        this.prevLong = this.long;
      }
    }, {
      key: "handleEnd",
      value: function handleEnd() {
        if (this.handledControl == 0) return;
        this.handledControl = 0;
        this.containerEmmiter.emit('viewport-end');
      }
    }]);

    return MapViewbox;
  }();

  var Map =
  /*#__PURE__*/
  function () {
    function Map(options) {
      var _this = this;

      _classCallCheck(this, Map);

      this.isChild = options.isChild;
      this.height = options.height;
      this.currentWidth = 0;
      var $dom = document.createElement('div');
      $dom.classList.add('map');
      this.$dom = $dom;
      var $inner = document.createElement('div');
      $inner.classList.add('map_inner');
      $dom.appendChild($inner);
      $inner.appendChild(options.renderer.$dom);
      this.renderer = options.renderer;
      var containerEmmiter = options.containerEmmiter; // Left and right transparent overlays

      var overlay = new MapOverlay({
        containerEmmiter: containerEmmiter
      });
      $dom.appendChild(overlay.$dom);
      this.overlay = overlay;
      var viewbox = new MapViewbox({
        containerEmmiter: containerEmmiter
      });
      $dom.appendChild(viewbox.$dom);
      this.viewbox = viewbox;
      options.globalEmmiter.on('resize', function () {
        _this.calculateWidth();
      });
      setTimeout(function () {
        if (_this.isHidden) return;

        _this.calculateWidth(true);

        _this.renderer.start();
      }, 0);
    }

    _createClass(Map, [{
      key: "show",
      value: function show(linesVisibility) {
        var _this2 = this;

        this.isHidden = false;
        this.$dom.style.display = 'block';
        setTimeout(function () {
          if (_this2.isChild) _this2.$dom.classList.remove('map__child-hide');else _this2.$dom.classList.remove('map__main-hide');

          _this2.$dom.classList.remove('map__bars-hide');
        }, 0);
        setTimeout(function () {
          _this2.calculateWidth(true);

          _this2.renderer.start(linesVisibility);
        }, 0);
      }
    }, {
      key: "hide",
      value: function hide(isBarsSingleAnimate) {
        var _this3 = this;

        this.isHidden = true;
        this.renderer.stop();

        if (isBarsSingleAnimate) {
          this.$dom.classList.add('map__bars-hide');
        } else {
          if (this.isChild) this.$dom.classList.add('map__child-hide');else this.$dom.classList.add('map__main-hide');
        }

        setTimeout(function () {
          _this3.$dom.style.display = 'none';
        }, 325);
      }
    }, {
      key: "calculateWidth",
      value: function calculateWidth(isFirst) {
        // Map left and right padding
        var width = this.$dom.offsetWidth - 36;
        if (width == this.currentWidth && !isFirst) return;
        this.currentWidth = width;
        this.overlay.setWidth(width);
        this.viewbox.setWidth(width);
        this.renderer.setSize(width, this.height);
      }
    }]);

    return Map;
  }();

  var Title = function Title(options) {
    _classCallCheck(this, Title);

    var $dom = document.createElement('div');
    $dom.className = 'title';
    this.$dom = $dom;
    var $text = document.createElement('div');
    $text.className = 'title_text';
    $dom.appendChild($text);
    var titleSwitcher = new TextSwitcher({
      text: options.text,
      isLeft: true
    });
    $text.appendChild(titleSwitcher.$dom);
    options.containerEmmiter.on('switch-title', function (isLink) {
      var content = options.text;

      if (isLink) {
        content = document.createElement('div');
        content.className = 'title_zoom';
        content.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51 51">' + '<path d="M45.218,50.167,33.2,38.146a3.5,3.5,0,0,1-.541-4.253A19.5,19.5,0,0,1,5.711,5.711,19.5,19.5,0,0,1,33.894,32.656a3.5,3.5,0,0,1,4.253.541l12.02,12.021a3.5,3.5,0,1,1-4.949,4.949ZM6,19.5A13.5,13.5,0,1,0,19.5,6,13.515,13.515,0,0,0,6,19.5ZM15.5,23a3.5,3.5,0,1,1,0-7h8a3.5,3.5,0,0,1,0,7Z"/>' + '</svg>' + '<span>Zoom Out</span>';
        content.addEventListener('click', function () {
          options.containerEmmiter.emit('main-chart');
        });
      }

      titleSwitcher.change(content, !isLink);
    });
    var $addit = document.createElement('div');
    $addit.className = 'title_addit';
    $dom.appendChild($addit);
    var additSwitcher = new TextSwitcher({
      isRight: true
    });
    $addit.appendChild(additSwitcher.$dom);
    options.containerEmmiter.on('viewport-range-text', function (rangeText, isUp, isSet) {
      if (isSet) additSwitcher.$elem.textContent = rangeText;else additSwitcher.change(rangeText, isUp);
    });
  };

  var TooltipElement =
  /*#__PURE__*/
  function () {
    function TooltipElement(options) {
      _classCallCheck(this, TooltipElement);

      var color = Colors.get(options.color);
      var lightColor = 'rgb(' + color.light.join(',') + ')';
      var darkColor = 'rgb(' + color.dark.join(',') + ')';
      var $dom = document.createElement('div');
      $dom.classList.add('tooltip_element');
      var $tooltipName = document.createElement('div');
      $tooltipName.classList.add('tooltip_name');
      $tooltipName.textContent = options.name;
      $dom.appendChild($tooltipName);
      var $tooltipValue = document.createElement('div');
      $tooltipValue.classList.add('tooltip_value');
      $dom.appendChild($tooltipValue);
      $tooltipValue.style.color = lightColor;
      var valueSwitcher = new TextSwitcher({
        isRight: true
      });
      $tooltipValue.appendChild(valueSwitcher.$dom);
      this.valueSwitcher = valueSwitcher;
      options.globalEmmiter.on('theme-change', function (isDark) {
        $tooltipValue.style.color = isDark ? darkColor : lightColor;
      });
      this.$dom = $dom;
      this.isVisible = true;
    }

    _createClass(TooltipElement, [{
      key: "setValue",
      value: function setValue(value, dir, isInstantly) {
        if (this.prevValue == value) return;
        this.prevValue = value;
        if (isInstantly) this.valueSwitcher.set(value);else this.valueSwitcher.set(value, dir);
      }
    }, {
      key: "setVisibility",
      value: function setVisibility(state) {
        this.isVisible = state;
        this.$dom.style.display = state ? null : 'none';
      }
    }]);

    return TooltipElement;
  }();

  var Tooltip =
  /*#__PURE__*/
  function () {
    function Tooltip(options) {
      var _this = this;

      _classCallCheck(this, Tooltip);

      this.globalEmmiter = options.globalEmmiter;
      this.countAll = options.countAll;
      this.isPercents = options.isPercents;
      var $dom = document.createElement('div');
      $dom.classList.add('tooltip');
      this.$dom = $dom;
      var $loader = document.createElement('div');
      $loader.classList.add('tooltip_loader');
      $dom.appendChild($loader);
      this.$loader = $loader;
      var $tooltipHeader = document.createElement('div');
      $tooltipHeader.classList.add('tooltip_header');
      this.$dom.appendChild($tooltipHeader);
      var headerSwitcher = new TextSwitcher({
        isLeft: options.isHeaderLeft
      });
      $tooltipHeader.appendChild(headerSwitcher.$dom);
      this.headerSwitcher = headerSwitcher;

      if (options.showArrow) {
        var $arrow = document.createElement('div');
        $arrow.className = 'tooltip_arrow';
        $arrow.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 29">' + '<path fill="#d2d5d7" d="M1.768,29.324a2.5,2.5,0,0,1,0-3.535L12.011,15.546,1.768,5.3A2.5,2.5,0,0,1,5.3,1.768L17.122,13.587a2.527,2.527,0,0,1,.2.182,2.524,2.524,0,0,1,0,3.556,2.529,2.529,0,0,1-.2.182L5.3,29.324a2.5,2.5,0,0,1-3.536,0Z"/>' + '</svg>';
        $tooltipHeader.appendChild($arrow);
        $dom.style.cursor = 'pointer';
      } else {
        $dom.style.cursor = 'auto';
      }

      var $tooltipElements = document.createElement('div');
      $tooltipElements.classList.add('tooltip_elements');
      this.$tooltipElements = $tooltipElements;
      this.$dom.appendChild($tooltipElements);
      this.hideTimeout = null;
      this.prevDate = null;

      if (options.onclick) {
        $dom.addEventListener('click', function () {
          options.onclick(_this);
        });
      }
    }

    _createClass(Tooltip, [{
      key: "setInitData",
      value: function setInitData(lines) {
        var _this2 = this;

        this.$tooltipElements.innerHTML = '';
        var elements = {};
        lines.forEach(function (line) {
          var tooltipElement = new TooltipElement({
            name: line.name,
            color: line.color + ':line',
            globalEmmiter: _this2.globalEmmiter
          });

          _this2.$tooltipElements.appendChild(tooltipElement.$dom);

          elements[line.id] = tooltipElement;
        });

        if (this.countAll) {
          var tooltipElement = new TooltipElement({
            name: 'All',
            color: 'TEXT',
            globalEmmiter: this.globalEmmiter
          });
          this.$tooltipElements.appendChild(tooltipElement.$dom);
          elements.all = tooltipElement;
        }

        this.elements = elements;
      }
    }, {
      key: "createDateSwitcher",
      value: function createDateSwitcher(date) {
        var result = {};
        var dayText = window.innerWidth <= 400 ? date.d.toString() : date.dw + ', ' + date.d;
        var day = new TextSwitcher({
          text: dayText
        });
        result.day = day;
        var $month = document.createElement('span');
        $month.appendChild(day.$dom);
        var $monthText = document.createElement('span');
        $monthText.textContent = ' ' + date.m;
        $month.appendChild($monthText);
        var month = new TextSwitcher({
          text: $month
        });
        result.month = month;
        var $year = document.createElement('span');
        $year.appendChild(month.$dom);
        var $yearText = document.createElement('span');
        $yearText.textContent = ' ' + date.y;
        $year.appendChild($yearText);
        var year = new TextSwitcher({
          text: $year
        });
        result.year = year;
        return result;
      }
    }, {
      key: "setData",
      value: function setData(data) {
        var _this3 = this;

        this.timestamp = data.timestamp;

        if (this.isPercents) {
          var all = 0;
          Object.keys(data.values).forEach(function (id) {
            if (!_this3.elements[id].isVisible) return;
            all += data.values[id];
          });
          var roundingAddit = 0;
          Object.keys(data.values).forEach(function (id) {
            var percent = 100 * data.values[id] / all - roundingAddit;
            var roundingPercent = Math.round(percent);
            roundingAddit = roundingPercent - percent;

            _this3.elements[id].setValue(roundingPercent.toString(), data.dir, data.isInstantly);
          });
        } else {
          var includedValues = Object.keys(data.values).filter(function (key) {
            return _this3.elements[key].isVisible;
          }).map(function (key) {
            return data.values[key];
          });
          var maxValue = Math.max.apply(null, includedValues);
          var formattedValues = data.values;

          if (window.innerWidth < 400) {
            for (var id in data.values) {
              formattedValues[id] = shortFormatValue(data.values[id], maxValue);
            }
          }

          var _all = 0;
          var visibleCount = 0;
          Object.keys(data.values).forEach(function (id) {
            if (!_this3.elements[id].isVisible) return;
            var setValue = window.innerWidth < 400 ? formattedValues[id] : formattedValues[id].toLocaleString('ru-RU');

            _this3.elements[id].setValue(setValue, data.dir, data.isInstantly);

            visibleCount++;
            if (_this3.countAll) _all += parseFloat(formattedValues[id]);
          });

          if (this.countAll) {
            this.elements.all.$dom.style.display = visibleCount < 2 ? 'none' : 'flex';

            var allValue = _all.toLocaleString('ru-RU');

            if (window.innerWidth < 400) {
              if (maxValue > 100 * 1000000) {
                allValue = _all.toFixed(0) + 'M';
              } else if (maxValue > 1000000) {
                allValue = _all.toFixed(1) + 'M';
              } else if (maxValue > 100 * 1000) {
                allValue = _all.toFixed(0) + 'K';
              } else if (maxValue > 1000) {
                allValue = _all.toFixed(1) + 'K';
              } else {
                allValue = parseInt(_all.toFixed(0)).toLocaleString('ru-RU');
              }

              if (allValue == '0M' || allValue == '0.0M' || allValue == '0K' || allValue == '0.0K') allValue = '0';
            }

            this.elements.all.setValue(allValue, data.dir, data.isInstantly);
          }
        }

        var dateObj = new Date(data.timestamp);

        if (data.range < 86400000 * 1.5) {
          var hours = dateObj.getHours();
          if (hours < 10) hours = '0' + hours;
          var minutes = dateObj.getMinutes();
          if (minutes < 10) minutes = '0' + minutes;
          if (data.isInstantly) this.headerSwitcher.set(hours + ':' + minutes, data.dir);else this.headerSwitcher.change(hours + ':' + minutes, data.dir);
          return;
        }

        var dateParts = dateObj.toDateString().split(' ');
        var date = {
          dw: dateParts[0],
          d: parseInt(dateParts[2]),
          m: dateParts[1],
          y: dateParts[3]
        };

        if (!this.prevDate || this.prevDate.y != date.y || data.isInstantly) {
          this.prevDate = date;
          var dateSwitcher = this.createDateSwitcher(date);
          this.dateSwitcher = dateSwitcher;
          this.headerSwitcher.set(dateSwitcher.year.$dom);
          return;
        }

        if (this.prevDate.m != date.m) {
          this.prevDate = date;
          var _dateSwitcher = this.dateSwitcher;
          var dayText = window.innerWidth <= 400 ? date.d.toString() : date.dw + ', ' + date.d;
          var day = new TextSwitcher({
            text: dayText
          });
          _dateSwitcher.day = day;
          var $month = document.createElement('span');
          $month.appendChild(day.$dom);
          var $monthText = document.createElement('span');
          $monthText.textContent = ' ' + date.m;
          $month.appendChild($monthText);

          _dateSwitcher.month.change($month, data.dir);

          var monthDiff = _dateSwitcher.month.$elem.offsetWidth - _dateSwitcher.month.$dom.offsetWidth;

          _dateSwitcher.year.updateWidth(monthDiff);

          return;
        }

        if (this.prevDate.d != date.d) {
          this.prevDate = date;
          var _dateSwitcher2 = this.dateSwitcher;

          var _dayText = window.innerWidth <= 400 ? date.d.toString() : date.dw + ', ' + date.d;

          _dateSwitcher2.day.change(_dayText, data.dir);

          var dayDiff = _dateSwitcher2.day.$elem.offsetWidth - _dateSwitcher2.day.$dom.offsetWidth;

          var _monthDiff = _dateSwitcher2.month.$elem.offsetWidth - _dateSwitcher2.month.$dom.offsetWidth;

          _dateSwitcher2.month.updateWidth(dayDiff);

          _dateSwitcher2.year.updateWidth(_monthDiff);

          return;
        }
      }
    }, {
      key: "toggleElement",
      value: function toggleElement(id, state) {
        this.elements[id].setVisibility(state);
      }
    }, {
      key: "setPos",
      value: function setPos(position) {
        this.position = position;
        var left = position + 18;

        if (position > this.$dom.parentNode.offsetWidth / 2) {
          left = position - this.$dom.offsetWidth - 18;
        }

        if (left < 5) left = 5;
        var maxLeft = this.width - 5 - this.$dom.offsetWidth;
        if (left > maxLeft) left = maxLeft;
        this.$dom.style.transform = 'translateX(' + left + 'px)';
      }
    }, {
      key: "show",
      value: function show(position) {
        var _this4 = this;

        clearTimeout(this.hideTimeout);
        this.$dom.style.display = 'block';
        setTimeout(function () {
          _this4.$dom.style.opacity = '1';
          _this4.$dom.style.transition = 'opacity 0.15s linear';

          _this4.setPos(position);

          setTimeout(function () {
            _this4.$dom.style.transition = null;
          }, 50);
        }, 0);
      }
    }, {
      key: "hide",
      value: function hide() {
        var _this5 = this;

        this.$dom.style.opacity = '0';
        this.hideTimeout = setTimeout(function () {
          _this5.$dom.style.display = 'none';
        }, 125);
      }
    }, {
      key: "setSize",
      value: function setSize(width) {
        this.width = width;
        this.hide();
      }
    }]);

    return Tooltip;
  }();

  var ChartLinesTooltipDot =
  /*#__PURE__*/
  function () {
    function ChartLinesTooltipDot(options) {
      _classCallCheck(this, ChartLinesTooltipDot);

      var color = Colors.get(options.color + ':line');
      var lightColor = 'rgb(' + color.light.join(',') + ')';
      var darkColor = 'rgb(' + color.dark.join(',') + ')';
      this.canvasLine = options.canvasLine;
      this.y = 0;
      this.x = 0;
      this.prevIndex = null;
      this.path = [];
      var $dom = document.createElement('div');
      $dom.className = 'tooltip-lines_dot';
      $dom.style.borderColor = lightColor;
      this.$dom = $dom;
      options.globalEmmiter.on('theme-change', function (isDark) {
        $dom.style.borderColor = isDark ? darkColor : lightColor;
      });
    }

    _createClass(ChartLinesTooltipDot, [{
      key: "setPos",
      value: function setPos(index, endX, isFirst) {
        var _this = this;

        // Set without animation
        if (isFirst) {
          this.x = endX;
          if (!this.canvasLine.calculatedColumn) return;
          var y = this.canvasLine.calculatedColumn[index];
          this.y = y;
          this.$dom.style.transform = 'translateY(' + (y - 6) + 'px)';
          this.prevIndex = index;
          return;
        }

        var startIndex;
        var column;
        var dir;

        if (index < this.prevIndex) {
          startIndex = index;
          column = this.canvasLine.calculatedColumn.slice(index, this.prevIndex + 1);
          dir = -1;
        } else {
          startIndex = this.prevIndex;
          column = this.canvasLine.calculatedColumn.slice(this.prevIndex, index + 1);
          dir = 1;
        }

        var path = column.map(function (elem, i) {
          return {
            y: elem,
            x: _this.canvasLine.calculatedX[startIndex + i]
          };
        }); // Reverse path if negative direction

        if (dir == -1) path.reverse(); // Set current dot position as start point

        path[0] = {
          y: this.y,
          x: this.x
        }; // Normalize x poses to percents in [minX, maxX]

        var minX = path[0].x;
        var lengthX = path[path.length - 1].x - minX;
        this.path = path.map(function (elem) {
          return {
            y: elem.y,
            x: (elem.x - minX) / lengthX
          };
        });
        this.prevIndex = index;
      }
    }, {
      key: "move",
      value: function move(x, progress) {
        this.x = x; // Find last passed index

        var index = 0;

        for (var i = 0; i < this.path.length; i++) {
          if (this.path[i].x > progress) break;
          index = i;
        }

        var newY; // If last move tick

        if (index == this.path.length - 1) {
          newY = this.path[this.path.length - 1].y;
        } // Calculate middle y position value
        else {
            var startPerc = this.path[index].x;
            var endPerc = this.path[index + 1].x;
            var middlePerc = (progress - startPerc) / (endPerc - startPerc);
            var startY = this.path[index].y;
            newY = startY + (this.path[index + 1].y - startY) * middlePerc;
          }

        this.y = newY;
        this.$dom.style.transform = 'translateY(' + (newY - 6) + 'px)';
      }
    }]);

    return ChartLinesTooltipDot;
  }();

  var ChartLinesTooltip =
  /*#__PURE__*/
  function () {
    function ChartLinesTooltip(options) {
      var _this2 = this;

      _classCallCheck(this, ChartLinesTooltip);

      this.globalEmmiter = options.globalEmmiter;
      var $dom = document.createElement('div');
      $dom.className = 'tooltip-lines';
      this.$dom = $dom;
      this.prevIndex = null;
      this.step = 0;
      this.dir = 0;
      this.x = 0;
      this.startX = 0;
      this.endX = 0;
      this.prevWidth = 0;
      this.prevHeight = 0;
      options.globalEmmiter.on('render', function (delta) {
        if (_this2.step == 0) return;
        var deltaX = _this2.step * _this2.dir * delta;
        var newX = _this2.x + deltaX;

        if (_this2.dir == -1 && newX < _this2.endX) {
          newX = _this2.endX;
          _this2.step = 0;
        }

        if (_this2.dir == 1 && newX > _this2.endX) {
          newX = _this2.endX;
          _this2.step = 0;
        }

        _this2.x = newX;
        _this2.$dom.style.transform = 'translateX(' + newX + 'px)';
        var progress = (newX - _this2.startX) / (_this2.endX - _this2.startX);
        Object.keys(_this2.dots).forEach(function (key) {
          _this2.dots[key].move(newX, progress);
        });
      });
      this.hideTimeout = null;
    }

    _createClass(ChartLinesTooltip, [{
      key: "setData",
      value: function setData(options) {
        var _this3 = this;

        this.canvasLines = options.canvasLines;
        this.$dom.innerHTML = '<div class="tooltip-lines_line"></div>';
        var dots = options.lines.reduce(function (result, line) {
          var tooltipDot = new ChartLinesTooltipDot({
            color: line.color,
            canvasLine: options.canvasLines[line.id],
            globalEmmiter: _this3.globalEmmiter
          });

          _this3.$dom.appendChild(tooltipDot.$dom);

          result[line.id] = tooltipDot;
          return result;
        }, {});
        this.dots = dots;
      }
    }, {
      key: "setPos",
      value: function setPos(x, index, isFirst) {
        var _this4 = this;

        if (this.prevIndex === index && !isFirst) return;
        this.prevIndex = index;

        if (isFirst) {
          this.x = x;
          this.$dom.style.transform = 'translateX(' + x + 'px)';
          Object.keys(this.dots).forEach(function (key) {
            _this4.dots[key].setPos(index, x, isFirst);
          });
          return;
        }

        if (!this.x) this.x = x;
        Object.keys(this.dots).forEach(function (key) {
          _this4.dots[key].setPos(index, x);
        });
        this.startX = this.x;
        this.endX = x;
        this.step = Math.abs(this.x - x) / 150;
        this.dir = this.x - x < 0 ? 1 : -1;
      }
    }, {
      key: "show",
      value: function show(x, index) {
        clearTimeout(this.hideTimeout);
        this.$dom.style.display = 'block';
        this.$dom.style.opacity = '1';
        this.setPos(x, index, true);
      }
    }, {
      key: "hide",
      value: function hide() {
        var _this5 = this;

        this.$dom.style.opacity = '0';
        this.hideTimeout = setTimeout(function () {
          _this5.$dom.style.display = 'none';
        }, 175);
      }
    }, {
      key: "toggleElement",
      value: function toggleElement(id, state) {
        this.dots[id].$dom.style.display = state ? 'block' : 'none';
      }
    }, {
      key: "setSize",
      value: function setSize() {
        this.hide();
      }
    }]);

    return ChartLinesTooltip;
  }();

  var Renderer =
  /*#__PURE__*/
  function () {
    function Renderer(options) {
      var _this = this;

      _classCallCheck(this, Renderer);

      this.elements = [];
      this.needRedraw = true;
      var $dom = document.createElement('canvas');
      this.$dom = $dom;
      this.context = $dom.getContext('2d');
      this.globalEmmiter = options.globalEmmiter;
      this.isRunning = false;
      this.globalEmmiter.on('render', function (delta) {
        if (!_this.isRunning) return;

        _this.render(delta);
      });
      this.globalEmmiter.on('resize', function (delta) {
        _this.isVisible = isAnyPartOfElementInViewport($dom);
      });
      window.addEventListener('scroll', function () {
        _this.isVisible = isAnyPartOfElementInViewport($dom);
      });
      setTimeout(function () {
        _this.isVisible = isAnyPartOfElementInViewport($dom);
      }, 0);
    }

    _createClass(Renderer, [{
      key: "add",
      value: function add(element) {
        this.elements.push(element);
      }
    }, {
      key: "start",
      value: function start() {
        this.elements = this.elements.sort(function (a, b) {
          if (a.zIndex < b.zIndex) return 1;
          if (a.zIndex > b.zIndex) return -1;
          return 0;
        });
        this.isRunning = true;
        this.needRedraw = true;
      }
    }, {
      key: "stop",
      value: function stop() {
        this.isRunning = false;
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        var $dom = this.$dom;
        var pixelRatio = Math.floor(devicePixelRatio);
        $dom.width = width * pixelRatio;
        $dom.style.width = width + 'px';
        $dom.height = height * pixelRatio;
        $dom.style.height = height + 'px';
        this.context.scale(pixelRatio, pixelRatio);
        this.needRedraw = true;
        this.elements.forEach(function (element) {
          if (element.setSize) element.setSize(width, height);
        });
      }
    }, {
      key: "render",
      value: function render(delta) {
        if (!this.needRedraw) {
          this.isColorsChanging = Colors.isChanging;
          this.isColorsChanged = Colors.isChanged;
          this.needRedraw = this.isColorsChanging && this.isVisible || this.isColorsChanged; //if(!this.needRedraw && this.isColorsChanging) debugger;
        }

        if (!this.needRedraw) {
          for (var i = 0, l = this.elements.length; i < l; i++) {
            if (this.elements[i].needRedraw) {
              this.needRedraw = true;
              break;
            }
          }
        }

        if (this.needRedraw) {
          this.needRedraw = false;
          var $dom = this.$dom;
          var context = this.context;
          context.clearRect(0, 0, $dom.width, $dom.height);
          this.elements.forEach(function (element) {
            element.draw(context, delta);
          });
        }
      }
    }]);

    return Renderer;
  }();

  var ChartLinesRenderer =
  /*#__PURE__*/
  function (_Renderer) {
    _inherits(ChartLinesRenderer, _Renderer);

    function ChartLinesRenderer(options) {
      var _this;

      _classCallCheck(this, ChartLinesRenderer);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(ChartLinesRenderer).call(this, options));
      _this.type = options.type;
      _this.needRecalculateScaleCoef = true;
      _this.needRecalculateAsFirst = false;
      _this.prevMaxDotValue = null;
      _this.prevMinDotValue = null;
      _this.isSetScaleInstantly = false;
      _this.scaleUpdateTimeout = 0;
      _this.lastUpdateFired = 0;
      _this.lastRecalculatedFiredStart = 0;
      _this.lastRecalculatedFiredEnd = 0;
      _this.lastUpdateFiredStart = 0;
      _this.lastUpdateFiredEnd = 0;
      _this.containerEmmiter = options.containerEmmiter;
      return _this;
    }

    _createClass(ChartLinesRenderer, [{
      key: "start",
      value: function start() {
        this.calculateScaleCoef(true);

        _get(_getPrototypeOf(ChartLinesRenderer.prototype), "start", this).call(this);
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        _get(_getPrototypeOf(ChartLinesRenderer.prototype), "setSize", this).call(this, width, height);

        this.isSetScaleInstantly = true;
      }
    }, {
      key: "render",
      value: function render(delta) {
        if (this.needRecalculateScaleCoef) {
          this.calculateScaleCoef(this.needRecalculateAsFirst);
          this.needRecalculateAsFirst = false;
          this.needRecalculateScaleCoef = false;
          this.needRedraw = true;
        }

        _get(_getPrototypeOf(ChartLinesRenderer.prototype), "render", this).call(this, delta);
      }
    }, {
      key: "setAxisVisibility",
      value: function setAxisVisibility(id, state) {
        var yAxis = this.elements.find(function (element) {
          return element.type == 'axis-y' && element.id == id;
        });
        if (!yAxis) return;
        yAxis.setLabelsVisibility(state);
        this.calculateScaleCoef();
      }
    }, {
      key: "calculateScaleCoef",
      value: function calculateScaleCoef(isFirst) {
        var _this2 = this;

        var updateElementsScale = function updateElementsScale() {
          _this2.lastUpdateFired = performance.now();

          if (_this2.type == 'lines_scaled') {
            var yLines = _this2.elements.find(function (element) {
              return element.type == 'axis-y' && element.id == 'lines';
            });

            var y0 = _this2.elements.find(function (element) {
              return element.type == 'axis-y' && element.id == 'y0';
            });

            var line0 = _this2.elements.find(function (element) {
              return element.type == 'line' && element.id == 'y0';
            });

            var y1 = _this2.elements.find(function (element) {
              return element.type == 'axis-y' && element.id == 'y1';
            });

            var line1 = _this2.elements.find(function (element) {
              return element.type == 'line' && element.id == 'y1';
            });

            yLines.calculateScaleCoef(line0.maxValue, line0.minValue, isFirst);
            var minAxisValue0 = y0.calculateScaleCoef(line0.maxValue, line0.minValue, isFirst);
            line0.calculateScaleCoef(line0.maxValue, minAxisValue0, isFirst);
            var minAxisValue1 = y1.calculateScaleCoef(line1.maxValue, line1.minValue, isFirst);
            line1.calculateScaleCoef(line1.maxValue, minAxisValue1, isFirst);
          } else {
            var maxDotValue = _this2.elements.reduce(function (result, element) {
              if (element.type != 'line' || !element.calculateInvolved) return result;
              return Math.max(result, element.maxValue);
            }, -Infinity);

            var minDotValue = _this2.elements.reduce(function (result, element) {
              if (element.type != 'line' || !element.calculateInvolved) return result;
              return Math.min(result, element.minValue);
            }, Infinity);

            if (!isFirst && maxDotValue === _this2.prevMaxDotValue && minDotValue === _this2.prevMinDotValue) return;
            _this2.prevMaxDotValue = maxDotValue;
            _this2.prevMinDotValue = minDotValue;
            var minAxisValue = 0;

            _this2.elements.forEach(function (element) {
              if (element.type == 'axis-y') {
                minAxisValue = element.calculateScaleCoef(maxDotValue, minDotValue, isFirst);
              }
            });

            _this2.elements.forEach(function (element) {
              if (element.type == 'line') {
                element.calculateScaleCoef(maxDotValue, minAxisValue, isFirst);
              }
            });
          }

          _this2.lastUpdateFiredStart = _this2.lastRecalculatedFiredStart;
          _this2.lastUpdateFiredEnd = _this2.lastRecalculatedFiredEnd;
        };

        if (isFirst || this.isSetScaleInstantly) {
          this.isSetScaleInstantly = false;
          updateElementsScale();
          return;
        } //updateElementsScale();


        var lastUpdatedChangeRange = 0.25 * (this.lastUpdateFiredEnd - this.lastUpdateFiredStart);

        if (Math.abs(this.lastUpdateFiredStart - this.lastRecalculatedFiredStart) > lastUpdatedChangeRange || Math.abs(this.lastUpdateFiredEnd - this.lastRecalculatedFiredEnd) > lastUpdatedChangeRange) {
          updateElementsScale();
          this.containerEmmiter.emit('viewport-change-update');
        }

        clearTimeout(this.scaleUpdateTimeout);
        var updateFiredDelta = performance.now() - this.lastUpdateFired;
        var timeout = updateFiredDelta > 300 ? 150 : 300 - updateFiredDelta + 16;
        this.scaleUpdateTimeout = setTimeout(updateElementsScale.bind(this), timeout);
      }
    }]);

    return ChartLinesRenderer;
  }(Renderer);

  var CanvasLine =
  /*#__PURE__*/
  function () {
    function CanvasLine(options) {
      _classCallCheck(this, CanvasLine);

      this.type = 'line';
      this.zIndex = options.zIndex;
      this.needRedraw = false;
      this.calculateInvolved = true;
      this.id = options.id;
      this.height = options.height;
      this.color = Colors.get(options.color + ':line');
      this.width = options.width;
      this.column = options.column;
      this.maxValue = Math.max.apply(null, options.column);
      this.minValue = Math.min.apply(null, options.column);
      this.maxDotPos = options.maxDotPos;
      this.minDotPos = options.minDotPos || 0;
      this.topOffset = options.topOffset || 0;
      this.calculatedColumn = null;
      this.calculatedX = null;
      this.startIndex = 0;
      this.endIndex = 0;
      this.animationDuration = 300;
      this.useToggleScaleAnimation = options.useToggleScaleAnimation;
      this.scaleCoef = 0;
      this.currentScaleCoef = 0;
      this.scaleStep = 0;
      this.opacity = 1;
      this.currentOpacity = 1;
      this.opacityStep = 0;
    }

    _createClass(CanvasLine, [{
      key: "setSize",
      value: function setSize(width, height) {
        this.height = height;
        this.maxDotPos = height - this.topOffset;
        this.calculateColumn();
      }
    }, {
      key: "calculateScaleCoef",
      value: function calculateScaleCoef(maxDotValue, minDotValue, isFirst) {
        var scaleCoef = (this.maxDotPos - this.minDotPos) / (maxDotValue - minDotValue);
        if (!this.useToggleScaleAnimation && !this.calculateInvolved) return;
        if (scaleCoef == this.scaleCoef) return;

        if (isFirst) {
          this.scaleCoef = this.currentScaleCoef = scaleCoef;
          this.minDotValue = this.currentMinDotValue = minDotValue;
          this.calculateColumn();
          return;
        }

        var prevScaleCoef = this.currentScaleCoef;
        this.scaleCoef = scaleCoef;
        this.scaleStep = (this.scaleCoef - prevScaleCoef) / this.animationDuration;
        var prevMinDotValue = this.currentMinDotValue;
        this.minDotValue = minDotValue;
        this.minDotValueStep = (this.minDotValue - prevMinDotValue) / this.animationDuration;
        this.needRedraw = true;
      }
    }, {
      key: "calculateColumn",
      value: function calculateColumn() {
        var _this = this;

        this.calculatedColumn = this.column.slice(this.startIndex, this.endIndex + 1).map(function (value) {
          return _this.height - ((value - _this.minDotValue) * _this.scaleCoef + _this.minDotPos);
        });
      }
    }, {
      key: "setCalculatedX",
      value: function setCalculatedX(calculatedX, startIndex, endIndex) {
        this.calculatedX = calculatedX;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        var filteredColumn = this.column.slice(startIndex, endIndex + 1);
        this.maxValue = Math.max.apply(null, filteredColumn);
        this.minValue = Math.min.apply(null, filteredColumn);
        this.calculateColumn();
        this.needRedraw = true;
      }
    }, {
      key: "setVisibility",
      value: function setVisibility(state, isInstantly) {
        this.calculateInvolved = state;

        if (isInstantly) {
          this.opacity = state ? 1 : 0;
          this.currentOpacity = state ? 1 : 0;
          this.needRedraw = true;
          return;
        }

        this.opacity = state ? 1 : 0;
        this.opacityStep = 1 / this.animationDuration * (state ? 1 : -1);
        this.needRedraw = true;
      }
      /**
       * Draw line
       *
       * @param   {CanvasRenderingContext2D}  context  2D canvas rendering context
       * @param   {Number}                    delta    Time from last draw in ms
       */

    }, {
      key: "draw",
      value: function draw(context, delta) {
        var _this2 = this;

        if (!this.calculatedX) return;
        var isAnimating = false; // If opacity animated

        if (this.currentOpacity != this.opacity) {
          // Calculate next intermediate opacity value
          var nextOpacity = this.currentOpacity + this.opacityStep * delta; // If reached finish opacity value

          if (nextOpacity < 0 || nextOpacity > 1) {
            // Set finish value and disable redrawing
            this.currentOpacity = this.opacity;
            this.needRedraw = false;
          } else {
            this.currentOpacity = nextOpacity;
            isAnimating = true;
          }
        }

        var calculatedColumn = null; // If scaling animated

        if (this.currentScaleCoef != this.scaleCoef) {
          // Calculate next intermediate scale value
          var nextScaleCoef = this.currentScaleCoef + this.scaleStep * delta;
          var nextMinDotValue = this.currentMinDotValue + this.minDotValueStep * delta; // If reached finish scale value

          if (this.scaleStep > 0 && nextScaleCoef >= this.scaleCoef || this.scaleStep < 0 && nextScaleCoef <= this.scaleCoef) {
            // Set finish value and disable redrawing
            this.currentScaleCoef = this.scaleCoef;
            this.currentMinDotValue = this.minDotValue;
            this.needRedraw = false; // Calculate finish column values for caching

            this.calculateColumn();
          } else {
            // Calculate column values for current intermediate scale value
            calculatedColumn = this.column.slice(this.startIndex, this.endIndex + 1).map(function (value) {
              return _this2.height - ((value - _this2.currentMinDotValue) * nextScaleCoef + _this2.minDotPos);
            });
            this.currentScaleCoef = nextScaleCoef;
            this.currentMinDotValue = nextMinDotValue;
            isAnimating = true;
          }
        } // Get column values from cache if not set from intermediate scale value


        if (!calculatedColumn) calculatedColumn = this.calculatedColumn; // Not draw if zero opacity

        if (this.currentOpacity == 0) return;
        if (!isAnimating) this.needRedraw = false; // Setup draw styles

        context.globalAlpha = this.currentOpacity;
        context.globalCompositeOperation = 'destination-over';
        context.lineJoin = 'round';
        context.lineWidth = this.width;
        context.strokeStyle = this.color.value; // Draw line

        context.beginPath();
        context.moveTo(this.calculatedX[0], calculatedColumn[0]);

        for (var i = 1, l = calculatedColumn.length; i < l; i++) {
          //context.lineTo(this.calculatedX[i] | 0, calculatedColumn[i] | 0);
          context.lineTo(this.calculatedX[i], calculatedColumn[i]);
        }

        context.stroke(); // Reset used by other elements types styles

        context.globalAlpha = 1;
        context.globalCompositeOperation = 'source-over';
        context.lineJoin = 'miter';
      }
    }]);

    return CanvasLine;
  }();

  var CanvasAxisXValue =
  /*#__PURE__*/
  function () {
    function CanvasAxisXValue(options) {
      _classCallCheck(this, CanvasAxisXValue);

      this.x = options.x;
      this.needX = options.x;
      this.label = options.label; // Offset of 4 px need to normal render months names
      // with 'p', 'y', 'g'

      this.y = options.y - 4;
      this.width = options.width;
      this.zIndex = 1000;
      this.animationDuration = 300;
      this.scaleCoef = 1;
      this.currentScaleCoef = options.currentScaleCoef || 1;
      this.scaleStep = (this.scaleCoef - this.currentScaleCoef) / this.animationDuration;
      this.opacity = 1;
      this.currentOpacity = options.currentOpacity == undefined ? 1 : options.currentOpacity;
      this.opacityStep = 1 / this.animationDuration;
      this.xStep = 0;
      this.needRedraw = true;
      this.hidded = false;
      this.id = options.id;
    }

    _createClass(CanvasAxisXValue, [{
      key: "setSize",
      value: function setSize(width, height) {
        this.width = width; // Offset of 4 px need to normal render months names
        // with 'p', 'y', 'g'

        this.y = height - 4;
      }
    }, {
      key: "hide",
      value: function hide(scaleCoef) {
        //const prevScaleCoef = this.currentScaleCoef;
        //this.scaleCoef = scaleCoef;
        //this.scaleStep = (this.scaleCoef - prevScaleCoef) / this.animationDuration;
        this.opacity = 0;
        this.opacityStep *= -1;
        this.needRedraw = true;
        this.removeTime = performance.now();
      }
    }, {
      key: "move",
      value: function move(newX) {
        this.needX = newX;
        this.xStep = (newX - this.x) / this.animationDuration;
        this.needRedraw = true;
      }
    }, {
      key: "update",
      value: function update(delta) {
        if (this.xStep != 0) {
          var nextX = this.x + this.xStep * delta;

          if (this.xStep < 0 && nextX < this.needX || this.xStep > 0 && nextX > this.needX) {
            this.x = this.needX;
            this.xStep = 0;
          } else {
            this.x = nextX;
          }

          this.needRedraw = true;
        }

        if (this.opacity == this.currentOpacity) {
          this.needRedraw = false;
          return;
        }

        var nextOpacity = this.currentOpacity + this.opacityStep * delta;
        var nextScaleCoef = this.currentScaleCoef + this.scaleStep * delta;

        if (nextOpacity < 0 || nextOpacity > 1) {
          this.currentOpacity = this.opacity;
          this.currentScaleCoef = this.scaleCoef;
          this.needRedraw = false;
          if (this.opacity == 0) this.hidded = true;
        } else {
          this.currentOpacity = nextOpacity;
          this.currentScaleCoef = nextScaleCoef;
        }
      }
    }, {
      key: "draw",
      value: function draw(context, delta, isHideOutViewport) {
        context.globalAlpha = this.currentOpacity;
        context.globalCompositeOperation = 'source-over';
        context.fillText(this.label, this.x, this.y);
        context.globalAlpha = 1;
      }
    }]);

    return CanvasAxisXValue;
  }();

  var CanvasAxisX =
  /*#__PURE__*/
  function () {
    function CanvasAxisX(options) {
      var _this = this;

      _classCallCheck(this, CanvasAxisX);

      this.type = 'axis';
      this.zIndex = 0;
      this.needRedraw = false;
      this.width = 0;
      this.color = Colors.get(options.labelsColor || 'AXIS_LABEL');
      this.isHideOutViewport = true;
      options.containerEmmiter.on('viewport-start', function () {
        _this.isHideOutViewport = false;
        _this.needRedraw = true;
      });
      options.containerEmmiter.on('viewport-end', function () {
        _this.isHideOutViewport = true;
        _this.needRedraw = true;
      });
      this.prevLabelStep = 0;
      this.elements = {};
      this.hiddenElements = [];
      this.prevType = 'day';
    }

    _createClass(CanvasAxisX, [{
      key: "setData",
      value: function setData(x) {
        this.x = x;
        this.labels = x.map(function (value) {
          var dateParts = new Date(value).toDateString().split(' ').slice(1, 3);
          return dateParts[0] + ' ' + Number(dateParts[1]);
        });
        this.labelsTime = this.x.map(function (value) {
          var date = new Date(value);
          var hours = date.getHours();
          if (hours < 10) hours = '0' + hours;
          var minutes = date.getMinutes();
          if (minutes < 10) minutes = '0' + minutes;
          return hours + ':' + minutes;
        });
      }
    }, {
      key: "add",
      value: function add(id, element) {
        this.elements[id] = element;
      }
    }, {
      key: "remove",
      value: function remove(id) {
        var element = this.elements[id];
        element.hide();
        this.hiddenElements.push(element);
        delete this.elements[id];
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        var _this2 = this;

        this.width = width;
        this.height = height;
        Object.keys(this.elements).forEach(function (key) {
          _this2.elements[key].setSize(width, height);
        });
      }
    }, {
      key: "calculateViewport",
      value: function calculateViewport(isFirst, viewportStart, viewportLong, startIndex, endIndex) {
        var _this3 = this;

        if (!isFirst && !this.isFirsted) return;
        this.isFirsted = true;
        var viewportDotsCount = Math.ceil(this.labels.length * viewportLong) + 1;
        var labelStep = Math.floor(viewportDotsCount / 6);
        var startTime = this.x[startIndex];
        var endTime = this.x[endIndex];
        var labels = this.labels;
        var type = 'day';

        if (endTime - startTime < 86400000 * 1.5) {
          labels = this.labelsTime;
          type = 'time';
        }

        if (this.prevType != type) {
          this.elements = [];
          this.prevType = type;
        }

        if (labelStep != this.prevLabelStep) {
          var _actualIds = [];
          this.calculatedX.forEach(function (value, i) {
            i += startIndex;
            if (i % labelStep != 0) return;
            var label = labels[i];
            var id = _this3.x[i];

            if (!id) {
              id = _this3.x[0] + 86400000;
              value = _this3.calculatedX[_this3.calculatedX.length - 2];
              label = '00:00';
            }

            _actualIds.push(id);

            if (_this3.elements[id]) return;
            var xValue = new CanvasAxisXValue({
              //x: isFirst ? value : value * this.prevLabelStep / labelStep,
              x: value,
              // Offset of 4 px need to normal render months names
              // with 'p', 'y', 'g'
              y: _this3.height,
              width: _this3.width,
              label: label,
              currentOpacity: isFirst ? 1 : 0,
              id: id
            }); //if(!isFirst) xValue.move(value);

            _this3.add(id, xValue);
          });
          Object.keys(this.elements).forEach(function (key) {
            if (_actualIds.indexOf(parseInt(key)) == -1) {
              //this.elements[key].move(this.elements[key].x * this.prevLabelStep / labelStep);
              _this3.remove(key);
            }
          });
        }

        var actualIds = [];
        this.calculatedX.forEach(function (value, i) {
          i += startIndex;
          if (i % labelStep != 0 || isNaN(value)) return;
          var label = labels[i];
          var id = _this3.x[i];

          if (!id) {
            id = _this3.x[0] + 86400000;
            value = _this3.calculatedX[_this3.calculatedX.length - 2];
            label = '00:00';
          }

          actualIds.push(id);
          var notAdd = false;

          if (_this3.elements[id]) {
            _this3.elements[id].x = value;
            notAdd = true;
          }

          var hidded = _this3.hiddenElements.find(function (element) {
            return element.id == id;
          });

          if (hidded) {
            hidded.x = value;
          }

          if (notAdd) return;

          _this3.add(_this3.x[i], new CanvasAxisXValue({
            x: value,
            y: _this3.height,
            width: _this3.width,
            label: label,
            currentOpacity: isFirst ? 1 : 0,
            id: id
          }));
        });
        Object.keys(this.elements).forEach(function (key) {
          if (actualIds.indexOf(parseInt(key)) == -1) {
            var x = _this3.elements[key].x;
            _this3.elements[key].x = _this3.elements[key].x + (x < 50 ? -100 : 100);

            _this3.remove(key);
          }
        });
        this.viewportStart = viewportStart;
        this.viewportEnd = viewportLong;
        this.prevLabelStep = labelStep;
      }
    }, {
      key: "draw",
      value: function draw(context, delta) {
        var _this4 = this;

        this.hiddenElements.forEach(function (element) {
          element.update(delta);
        });
        Object.keys(this.elements).forEach(function (key) {
          _this4.elements[key].update(delta);
        });
        context.fillStyle = this.color.value;
        context.font = '12px HelveticaNeue';
        context.textAlign = 'center';
        Object.keys(this.elements).forEach(function (key) {
          var element = _this4.elements[key];
          element.draw(context);
        });
        this.hiddenElements.forEach(function (element) {
          element.draw(context);
        });
        var time = performance.now();
        this.hiddenElements.filter(function (element) {
          return element.removeTime;
        }).forEach(function (element) {
          if (time - element.removeTime < 300) return;

          _this4.hiddenElements.splice(_this4.hiddenElements.indexOf(element), 1);
        });
        Object.keys(this.elements).filter(function (key) {
          return _this4.elements[key].hidded;
        }).forEach(function (key) {
          _this4.remove(key);
        });
        var elementsRedraw = Object.keys(this.elements).filter(function (key) {
          return _this4.elements[key].needRedraw;
        }).length > 0;
        var hiddenRedraw = this.hiddenElements.filter(function (element) {
          return element.needRedraw;
        }).length > 0;
        this.needRedraw = elementsRedraw || hiddenRedraw;
      }
    }]);

    return CanvasAxisX;
  }();

  var CanvasAxisYValue =
  /*#__PURE__*/
  function () {
    function CanvasAxisYValue(options) {
      _classCallCheck(this, CanvasAxisYValue);

      this.needRedraw = false;
      this.zIndex = 1000;
      this.isRight = options.isRight;
      this.isLineTop = options.isLineTop;
      this.textStroke = Colors.get('BACKGROUND');
      this.lineColor = Colors.get('AXIS_LINE');
      this.isMin = options.isMin;
      this.x = options.x;
      this.y = options.y;
      this.label = options.label;
      this.width = options.width;
      this.height = options.height;
      this.animationDuration = 300;
      this.scaleCoef = 1;
      this.currentScaleCoef = options.currentScaleCoef || 1;
      this.scaleStep = (this.scaleCoef - this.currentScaleCoef) / this.animationDuration;
      this.opacity = 1;
      this.currentOpacity = options.currentOpacity == undefined ? 1 : options.currentOpacity;
      this.opacityStep = 1 / this.animationDuration;
      this.hidded = false;
      this.needRedraw = true;
      this.labelsVisibility = options.labelsVisibility;
      this.isOnlyLabels = options.isOnlyLabels;
      this.isOnlyLines = options.isOnlyLines;
      this.index = options.index;
    }

    _createClass(CanvasAxisYValue, [{
      key: "setSize",
      value: function setSize(width, height, isRight) {
        this.width = width;
        this.height = height;
        if (isRight) this.x = width + 18;
      }
    }, {
      key: "hide",
      value: function hide(scaleCoef, isImmediately) {
        this.isHidded = true;
        var prevScaleCoef = this.currentScaleCoef;
        this.scaleCoef = scaleCoef;
        this.scaleStep = (this.scaleCoef - prevScaleCoef) / this.animationDuration;
        this.opacity = 0;
        this.opacityStep *= -1;
        if (isImmediately) this.currentOpacity = 0;
        this.needRedraw = true;
      }
    }, {
      key: "update",
      value: function update(delta) {
        if (this.opacity == this.currentOpacity) {
          this.needRedraw = false;
          return;
        }

        var nextOpacity = this.currentOpacity + this.opacityStep * delta;
        var nextScaleCoef = this.currentScaleCoef + this.scaleStep * delta;

        if (nextOpacity < 0 || nextOpacity > 1) {
          this.currentOpacity = this.opacity;
          this.currentScaleCoef = this.scaleCoef;
          this.needRedraw = false;
          if (this.opacity == 0) this.hidded = true;
        } else {
          this.currentOpacity = nextOpacity;
          this.currentScaleCoef = nextScaleCoef;
        }
      }
    }, {
      key: "draw",
      value: function draw(context, notDrawLine) {
        context.globalAlpha = this.currentOpacity;
        var scaledY = this.y * this.currentScaleCoef;

        if (!this.isMin && !notDrawLine && !this.isOnlyLabels) {
          if (!this.isLineTop) context.globalCompositeOperation = 'destination-over';else context.globalCompositeOperation = 'source-over';
          context.lineWidth = 1;
          context.strokeStyle = this.lineColor.value;
          context.beginPath();
          context.moveTo(this.x, this.height - scaledY);
          context.lineTo(this.x + this.width, this.height - scaledY);
          context.stroke();
        }

        if (!this.isOnlyLines && this.labelsVisibility) {
          context.globalCompositeOperation = 'source-over';
          context.strokeStyle = this.textStroke.value;
          context.lineWidth = 3.5;
          context.lineJoin = 'round';
          var xOffset = this.isRight ? -5 : 5;
          context.strokeText(this.label, this.x + xOffset, this.height - (scaledY + 7));
          context.fillText(this.label, this.x + xOffset, this.height - (scaledY + 7));
          context.lineWidth = 1;
          context.lineJoin = 'meter';
        }

        context.globalAlpha = 1;
      }
    }]);

    return CanvasAxisYValue;
  }();

  var CanvasAxisY =
  /*#__PURE__*/
  function () {
    function CanvasAxisY(options) {
      _classCallCheck(this, CanvasAxisY);

      this.id = options.id;
      this.isRight = options.isRight;
      this.isLineTop = options.isLineTop;
      this.type = 'axis-y';
      this.zIndex = 0;
      this.needRedraw = false;
      this.width = 0;
      this.countValues = options.countValues || 6;
      this.valuesOffset = 18;
      this.overlayHeight = options.overlayHeight || 0;
      this.minDotPos = options.minDotPos || 0;
      this.textColor = Colors.get(options.labelsColor || 'AXIS_LABEL');
      this.lineColor = Colors.get('AXIS_LINE');
      this.prevAxisValueStep = null;
      this.elements = [];
      this.animationTimeout = 0;
      this.scaleCoef = 0;
      this.minAxisValue = 0;
      this.labelsVisibility = true;
      this.isOnlyLabels = options.isOnlyLabels;
      this.isOnlyLines = options.isOnlyLines;
    }

    _createClass(CanvasAxisY, [{
      key: "setSize",
      value: function setSize(width, height) {
        var _this = this;

        var selfWidth = width - this.valuesOffset * 2;
        this.width = selfWidth;
        this.height = height;
        this.maxDotPos = height - this.overlayHeight;
        this.elements.forEach(function (element) {
          element.setSize(selfWidth, height, _this.isRight);
        });
        this.needRedraw = true;
      }
    }, {
      key: "setLabelsVisibility",
      value: function setLabelsVisibility(state) {
        this.labelsVisibility = state;
        this.calculateScaleCoef(this.prevMaxDotValue, this.prevMinDotValue, false, true);
      }
    }, {
      key: "calculateScaleCoef",
      value: function calculateScaleCoef(maxDotValue, minDotValue, isFirst, disableCheck) {
        this.prevMaxDotValue = maxDotValue;
        this.prevMinDotValue = minDotValue;
        var valuesHeight = this.maxDotPos - this.minDotPos;
        var valuesOffsetHeight = valuesHeight - this.overlayHeight;
        var offsetCoef = valuesOffsetHeight / valuesHeight;
        var maxOffsetDotValue = maxDotValue * offsetCoef;
        var minOffsetDotValue = minDotValue * offsetCoef;
        var axisValueStep = Math.floor((maxOffsetDotValue - minOffsetDotValue) / (this.countValues - 1));
        var scaleCoef = (this.maxDotPos - this.minDotPos) / (maxDotValue - minDotValue);
        if (scaleCoef == this.scaleCoef && !disableCheck) return this.minAxisValue;
        this.scaleCoef = scaleCoef;
        var newValuesPosCoef = isFirst ? 1 : axisValueStep / this.prevAxisValueStep;
        var oldValuesPosCoef = this.prevAxisValueStep / axisValueStep;
        this.prevAxisValueStep = axisValueStep;
        this.elements.forEach(function (element) {
          element.hide(oldValuesPosCoef, isFirst);
        });
        var maxAxisValue = axisValueStep * (this.countValues - 1);
        var minAxisValue = 0;

        for (var i = 0; i < this.countValues; i++) {
          var labelOrigValue = axisValueStep * i + minDotValue;
          if (i == 0) minAxisValue = labelOrigValue;
          var labelValue = '';

          if (maxAxisValue > 100 * 1000000) {
            labelValue = (labelOrigValue / 1000000).toFixed(0) + 'M';
          } else if (maxAxisValue > 1000000) {
            labelValue = (labelOrigValue / 1000000).toFixed(1) + 'M';
          } else if (maxAxisValue > 100 * 1000) {
            labelValue = (labelOrigValue / 1000).toFixed(0) + 'K';
          } else if (maxAxisValue > 1000) {
            labelValue = (labelOrigValue / 1000).toFixed(1) + 'K';
          } else {
            labelValue = labelOrigValue.toFixed(0);
          }

          if (labelValue == '0M' || labelValue == '0.0M' || labelValue == '0K' || labelValue == '0.0K') labelValue = '0';
          this.elements.push(new CanvasAxisYValue({
            isRight: this.isRight,
            x: this.valuesOffset + (this.isRight ? this.width : 0),
            // Offset of 4 px need
            // to normal render months names with 'p', 'y', 'g'
            y: axisValueStep * i * scaleCoef + this.minDotPos,
            width: this.width,
            height: this.height,
            label: labelValue,
            currentOpacity: isFirst ? 1 : 0,
            currentScaleCoef: isFirst ? 1 : newValuesPosCoef,
            isMin: i == 0,
            isLineTop: this.isLineTop,
            labelsVisibility: this.labelsVisibility,
            isOnlyLabels: this.isOnlyLabels,
            isOnlyLines: this.isOnlyLines,
            index: i
          }));
        }

        this.minAxisValue = minAxisValue;
        return minAxisValue;
      }
    }, {
      key: "draw",
      value: function draw(context, delta) {
        var _this2 = this;

        this.elements.forEach(function (element) {
          element.update(delta);
        });
        context.fillStyle = this.textColor.value;
        context.font = '12px HelveticaNeue';
        context.textAlign = this.isRight ? 'right' : 'left';

        if (!this.isRight && !this.isOnlyLabels) {
          context.strokeStyle = this.lineColor.value;
          context.strokeWidth = 1;
          var zeroY = this.height - this.minDotPos;
          context.beginPath();
          context.moveTo(this.valuesOffset, zeroY);
          context.lineTo(this.valuesOffset + this.width, zeroY);
          context.stroke();
        }

        this.elements.forEach(function (element) {
          element.draw(context, _this2.isRight);
        });
        this.elements.filter(function (element) {
          return element.hidded;
        }).forEach(function (element) {
          _this2.elements.splice(_this2.elements.indexOf(element), 1);
        });
        this.needRedraw = this.elements.filter(function (element) {
          return element.needRedraw;
        }).length > 0;
      }
    }]);

    return CanvasAxisY;
  }();

  var CanvasOverlay =
  /*#__PURE__*/
  function () {
    function CanvasOverlay(height, globalEmmiter) {
      var _this = this;

      _classCallCheck(this, CanvasOverlay);

      this.zIndex = 999;
      this.needRedraw = false;
      this.height = height;
      this.width = 0;
      this.canvasHeight = 0;
      this.color = Colors.get('BACKGROUND');
      this.needCreateGradient = true;
      globalEmmiter.on('theme-change', function () {
        _this.needCreateGradient = true;
      });
    }

    _createClass(CanvasOverlay, [{
      key: "setSize",
      value: function setSize(width, height) {
        this.width = width;
        this.canvasHeight = height;
        this.needCreateGradient = true;
      }
    }, {
      key: "draw",
      value: function draw(context) {
        // !!!
        this.needRedraw = Colors.isChanging;
        if (this.needRedraw) return;

        if (this.needCreateGradient) {
          var gradient = context.createLinearGradient(0, this.canvasHeight - 20, 0, this.canvasHeight);
          gradient.addColorStop(0, 'rgba(' + this.color.parts + ',0)');
          gradient.addColorStop(1, 'rgba(' + this.color.parts + ',1)');
          this.fillStyle = gradient;
          this.needCreateGradient = false;
        }

        context.fillStyle = this.fillStyle;
        context.fillRect(0, this.canvasHeight - 20, this.width, this.height);
      }
    }]);

    return CanvasOverlay;
  }();

  var ChartLinesCanvas =
  /*#__PURE__*/
  function () {
    function ChartLinesCanvas(options) {
      var _this = this;

      _classCallCheck(this, ChartLinesCanvas);

      this.isBarsSingleChild = options.isBarsSingleChild;
      this.type = options.type;
      this.isChild = options.isChild;
      this.overlayHeight = 20;
      this.width = 0;
      this.chartHeight = 0;
      this.lastInnerHeight = 0;
      this.viewportStart = options.viewportStart;
      this.viewportLong = options.viewportLong;
      var $dom = document.createElement('div');
      $dom.classList.add('chart');
      this.$dom = $dom;
      var globalEmmiter = options.globalEmmiter;
      this.globalEmmiter = options.globalEmmiter;
      var containerEmmiter = options.containerEmmiter;
      this.containerEmmiter = options.containerEmmiter;
      var $overlay = document.createElement('div');
      $overlay.className = 'overlay';
      $dom.appendChild($overlay);
      this.$overlay = $overlay;
      var renderer = new ChartLinesRenderer({
        type: options.type,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(renderer.$dom);
      this.renderer = renderer;
      var chartTooltip = new ChartLinesTooltip({
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(chartTooltip.$dom);
      this.chartTooltip = chartTooltip;
      var tooltip = new Tooltip({
        isHeaderLeft: this.isChild,
        showArrow: !options.isChild,
        onclick: options.tooltipClickHandler,
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(tooltip.$dom);
      this.tooltip = tooltip;
      this.handleInteractive(); //
      // Dates range values
      //

      this.prevIsShortDates = window.innerWidth <= 400;
      this.prevRangeText = '';
      this.prevDates = '';
      this.switcherChangeTimeout;
      globalEmmiter.on('resize', function () {
        if (_this.isHidden) return;

        _this.calculateSize();
      });
      globalEmmiter.on('theme-change', function () {
        _this.$overlay.style.opacity = '0';
      });
      globalEmmiter.on('theme-changed', function () {
        _this.$overlay.style.opacity = '1';
      });
      containerEmmiter.on('line-toggle', function (id, state) {
        if (_this.isHidden || !_this.isDataSetted) return;

        _this.canvasLines[id].setVisibility(state);

        _this.renderer.setAxisVisibility(id, state);

        renderer.needRecalculateScaleCoef = true;
        renderer.isSetScaleInstantly = true;
        setTimeout(function () {
          chartTooltip.toggleElement(id, state);
          tooltip.toggleElement(id, state);
        }, 175);
      });
      containerEmmiter.on('viewport-change', function (start, long) {
        if (_this.isHidden || !_this.isDataSetted) return;
        _this.viewportStart = start;
        _this.viewportLong = long;

        _this.calculateViewport();
      });
      containerEmmiter.on('viewport-change-update', function () {
        if (_this.isHidden || !_this.isDataSetted) return;

        _this.calculateRangeDates(true);
      });
    }

    _createClass(ChartLinesCanvas, [{
      key: "setData",
      value: function setData(data) {
        var _this2 = this;

        this.isDataSetted = true;
        this.x = data.x;
        this.lines = data.lines;
        this.minX = this.x[0];
        this.maxX = this.x[this.x.length - 1];
        this.renderer.elements = [];
        var canvasLines = data.lines.reduce(function (result, line, i) {
          var canvasLine = new CanvasLine({
            id: line.id,
            zIndex: i + 10,
            minDotPos: 21,
            topOffset: _this2.overlayHeight + 6,
            color: line.color,
            width: 2,
            column: line.column,
            useToggleScaleAnimation: true
          });

          if (data.linesVisibility && !data.linesVisibility[line.id]) {
            canvasLine.setVisibility(false, true);
          }

          _this2.renderer.add(canvasLine);

          if (_this2.type == 'lines_scaled') {
            if (line.id == 'y0') {
              var canvasAxisYLines = new CanvasAxisY({
                id: 'lines',
                overlayHeight: _this2.overlayHeight,
                minDotPos: 21,
                isOnlyLines: true
              });

              _this2.renderer.add(canvasAxisYLines);

              var canvasAxisY = new CanvasAxisY({
                id: 'y0',
                overlayHeight: _this2.overlayHeight,
                minDotPos: 21,
                labelsColor: line.color + ':line',
                isOnlyLabels: true
              });

              _this2.renderer.add(canvasAxisY);
            }

            if (line.id == 'y1') {
              var _canvasAxisY = new CanvasAxisY({
                id: 'y1',
                overlayHeight: _this2.overlayHeight,
                minDotPos: 21,
                labelsColor: line.color + ':line',
                isRight: true
              });

              _this2.renderer.add(_canvasAxisY);
            }
          }

          result[line.id] = canvasLine;
          return result;
        }, {});
        this.canvasLines = canvasLines;
        var canvasAxisX = new CanvasAxisX({
          containerEmmiter: this.containerEmmiter
        });
        this.renderer.add(canvasAxisX);
        this.canvasAxisX = canvasAxisX;

        if (this.type == 'lines') {
          var canvasAxisY = new CanvasAxisY({
            overlayHeight: this.overlayHeight,
            minDotPos: 21
          });
          this.renderer.add(canvasAxisY);
        }

        this.renderer.add(new CanvasOverlay(this.overlayHeight, this.globalEmmiter));
        this.canvasAxisX.setData(data.x);
        this.chartTooltip.setData({
          lines: data.lines,
          canvasLines: canvasLines
        });
        this.tooltip.setInitData(data.lines);
      }
    }, {
      key: "hide",
      value: function hide() {
        var _this3 = this;

        this.isHidden = true;
        this.renderer.stop();
        if (this.isChild) this.$dom.classList.add('chart__child-hide');else this.$dom.classList.add('chart__main-hide');
        setTimeout(function () {
          _this3.$dom.style.display = 'none';
        }, 325);
      }
    }, {
      key: "show",
      value: function show(linesVisibility) {
        var _this4 = this;

        this.isHidden = false;
        this.$dom.style.display = 'block';
        setTimeout(function () {
          if (_this4.isChild) _this4.$dom.classList.remove('chart__child-hide');else _this4.$dom.classList.remove('chart__main-hide');
        }, 0);

        if (linesVisibility) {
          Object.keys(this.canvasLines).forEach(function (id) {
            _this4.canvasLines[id].setVisibility(linesVisibility[id], true);

            _this4.tooltip.toggleElement(id, linesVisibility[id]);

            _this4.chartTooltip.toggleElement(id, linesVisibility[id]);

            _this4.renderer.setAxisVisibility(id, linesVisibility[id]);
          });
        }

        setTimeout(function () {
          _this4.calculateSize(true);

          _this4.renderer.start();
        }, 0);
      }
    }, {
      key: "calculateRangeDates",
      value: function calculateRangeDates(isInstantly) {
        var _this5 = this;

        var dates = this.x[this.startIndex] + '-' + this.x[this.endIndex];
        if (this.prevDates == dates && !isInstantly) return;

        if (isInstantly) {
          clearTimeout(this.switcherChangeTimeout);
          var rangeText = generateRangeText(this.x[this.startIndex], this.x[this.endIndex]);
          if (rangeText == this.prevRangeText) return;
          this.containerEmmiter.emit('viewport-range-text', rangeText, dates < this.prevDates);
          this.prevRangeText = rangeText;
          this.prevDates = dates;
          return;
        }

        var isShortDates = window.innerWidth <= 400;

        if (isShortDates != this.prevIsShortDates) {
          this.prevIsShortDates = isShortDates;

          var _rangeText = generateRangeText(this.x[this.startIndex], this.x[this.endIndex]);

          if (_rangeText == this.prevRangeText) return;
          this.containerEmmiter.emit('viewport-range-text', _rangeText, dates < this.prevDates, true);
          this.prevRangeText = _rangeText;
          this.prevDates = dates;
          return;
        }

        clearTimeout(this.switcherChangeTimeout);
        this.switcherChangeTimeout = setTimeout(function () {
          var rangeText = generateRangeText(_this5.x[_this5.startIndex], _this5.x[_this5.endIndex]);
          if (rangeText == _this5.prevRangeText) return;

          _this5.containerEmmiter.emit('viewport-range-text', rangeText, dates < _this5.prevDates);

          _this5.prevRangeText = rangeText;
          _this5.prevDates = dates;
        }, this.prevRangeText != '' ? 150 : 0);
      }
    }, {
      key: "calculateViewport",
      value: function calculateViewport(isFirst) {
        var width = this.width || 1;
        var fullWidth = width / this.viewportLong;
        var fixViewportStart = this.viewportStart - 18 / fullWidth;
        var fixViewportLong = this.viewportLong + 36 / fullWidth;
        var startIndex = Math.floor(fixViewportStart * this.x.length) - 1;
        var endIndex = Math.ceil((fixViewportStart + fixViewportLong) * this.x.length) + 2;
        if (startIndex < 0) startIndex = 0;
        if (endIndex > this.x.length - 1) endIndex = this.x.length - 1;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        var rangeX = this.maxX - this.minX;
        var minViewX = rangeX * fixViewportStart + this.minX;
        var fixCoef = width / (rangeX * fixViewportLong);
        this.calculatedX = this.x.slice(startIndex, endIndex + 1).map(function (value) {
          return (value - minViewX) * fixCoef;
        }); //
        // Calculate viewport range text for chart title
        //

        this.calculateRangeDates(); //
        // Set calculatedX to elements
        //

        for (var id in this.canvasLines) {
          this.canvasLines[id].setCalculatedX(this.calculatedX, startIndex, endIndex);
        }

        if (this.isBarsSingleChild) {
          var calculatedX = this.calculatedX.slice();
          calculatedX.push(0);
          this.canvasAxisX.calculatedX = calculatedX;
        } else this.canvasAxisX.calculatedX = this.calculatedX;

        this.canvasAxisX.calculateViewport(isFirst, this.viewportStart, this.viewportLong, startIndex, endIndex);
        this.renderer.needRecalculateAsFirst = isFirst;
        this.renderer.needRecalculateScaleCoef = true;
        this.renderer.lastRecalculatedFiredStart = startIndex;
        this.renderer.lastRecalculatedFiredEnd = endIndex;
        this.renderer.needRedraw = true;
      }
    }, {
      key: "calculateSize",
      value: function calculateSize(isFirst) {
        var isWidthChanged = false;
        var isHeightChanged = false; //
        // Width part
        //

        var $dom = this.$dom;
        var width = $dom.offsetWidth;

        if (this.tooltip.isVisible) {
          this.tooltip.isVisible = false;
          this.tooltip.show(this.tooltip.lastPosition * width / this.width);
        }

        if (width != this.width || isFirst) {
          isWidthChanged = true;
          this.width = width;
          this.calculateViewport(isFirst);
        } //
        // Height part
        //


        var windowHeight = innerHeight;
        var chartHeight = this.chartHeight; // Handle only height changes > 10%

        if (Math.abs(windowHeight - this.lastInnerHeight) / this.lastInnerHeight > 0.2) {
          this.lastInnerHeight = windowHeight;
          var isMobile = detectMobile();

          if (isMobile) {
            chartHeight = windowHeight * 0.5;
          } else {
            chartHeight = windowHeight * 0.3;
          }

          chartHeight = Math.round(chartHeight);
          if (chartHeight < 300) chartHeight = 300;

          if (chartHeight != this.chartHeight || isFirst) {
            isHeightChanged = true;
            this.chartHeight = chartHeight;
            this.renderer.needRecalculateAsFirst = true;
            this.renderer.needRecalculateScaleCoef = true;
            this.renderer.needRedraw = true;
          }
        }

        if (!isWidthChanged && !isHeightChanged) return; //
        // Set calculated values
        //

        this.tooltip.setSize(width, chartHeight);
        this.chartTooltip.setSize(width, chartHeight);
        this.tooltipVisible = false;
        this.renderer.setSize(width, chartHeight);
        this.containerEmmiter.emit('chart-size-sets', chartHeight);
      }
    }, {
      key: "handleInteractive",
      value: function handleInteractive() {
        var _this6 = this;

        this.tooltipVisible = false;
        var prevIndex = null;
        var currentGlobalEvent = null;

        var showTooltip = function showTooltip(x) {
          var xPos = x;
          var offset = _this6.calculatedX[0];

          var calcX = _this6.calculatedX.map(function (pos) {
            return pos - offset;
          });

          var index = Math.round((xPos - offset) / ((calcX[calcX.length - 1] - calcX[0]) / (calcX.length - 1)));
          if (index < 0) index = 0;

          if (index > _this6.calculatedX.length - 1) {
            index = _this6.calculatedX.length - 1;
          }

          if (index === prevIndex && _this6.tooltipVisible) return; // Not get elements out of viewport

          if (_this6.calculatedX[index] <= 0 || _this6.calculatedX[index] >= _this6.width) {
            var dir = _this6.calculatedX[index] <= 0 ? 1 : -1;

            for (var i = index + dir; true; i += dir) {
              if (_this6.calculatedX[i] > 0 && _this6.calculatedX[i] < _this6.width) {
                index = i;
                break;
              }
            }
          }

          var values = {};

          _this6.lines.forEach(function (line) {
            values[line.id] = line.column[_this6.startIndex + index];
          });

          var range = _this6.x[_this6.endIndex] - _this6.x[_this6.startIndex];

          _this6.tooltip.setData({
            timestamp: _this6.x[_this6.startIndex + index],
            values: values,
            dir: index < prevIndex,
            isInstantly: !_this6.tooltipVisible,
            range: range
          });

          if (!_this6.tooltipVisible) {
            var line = _this6.canvasLines.y0;

            if (line.scaleCoef != line.currentScaleCoef) {
              setTimeout(function () {
                _this6.chartTooltip.show(_this6.calculatedX[index], index);

                _this6.tooltip.show(_this6.calculatedX[index]);
              }, 300);
            } else {
              _this6.chartTooltip.show(_this6.calculatedX[index], index);

              _this6.tooltip.show(_this6.calculatedX[index]);
            }
          } else {
            _this6.chartTooltip.setPos(_this6.calculatedX[index], index);

            _this6.tooltip.setPos(_this6.calculatedX[index]);
          }

          prevIndex = index;
          currentGlobalEvent = _this6.startIndex + index;
          _this6.tooltipVisible = true;
        };

        var hideTooltip = function hideTooltip() {
          if (!_this6.tooltipVisible) return;

          _this6.tooltip.hide();

          _this6.chartTooltip.hide();

          _this6.tooltipVisible = false;
        };

        var startTouchX = 0;
        var startTouchY = 0;
        var touchShowTimeout = 0;
        var started = false;
        var disabled = false;
        var pressed = false;
        this.$dom.addEventListener('mousedown', function (e) {
          if (_this6.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          pressed = true;
          showTooltip(e.pageX - rect.left);
        });
        this.$dom.addEventListener('mousemove', function (e) {
          if (!pressed) return; //if(this.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          showTooltip(e.pageX - rect.left);
        });
        document.body.addEventListener('mouseleave', function (e) {
          if (pressed && !_this6.isChild) _this6.containerEmmiter.emit('tooltip-stopped', currentGlobalEvent);
          pressed = false;
        });
        document.body.addEventListener('mouseup', function (e) {
          if (pressed && !_this6.isChild) _this6.containerEmmiter.emit('tooltip-stopped', currentGlobalEvent);
          pressed = false;
        });
        this.$dom.addEventListener('touchstart', function (e) {
          if (_this6.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          startTouchX = e.touches[0].pageX - rect.left;
          startTouchY = e.touches[0].pageY - rect.top;
          started = false;
          disabled = false;
          touchShowTimeout = setTimeout(function () {
            started = true;
            showTooltip(startTouchX);
          }, 300);
        });
        this.$dom.addEventListener('touchmove', function (e) {
          if (disabled) return; //if(this.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          var touchX = e.touches[0].pageX - rect.left;

          if (!started) {
            var touchY = e.touches[0].pageY - rect.top;
            var lengthX = Math.abs(touchX - startTouchX);
            var lengthY = Math.abs(touchY - startTouchY);

            if (lengthY > lengthX) {
              clearTimeout(touchShowTimeout);
              disabled = true;
              hideTooltip();
              return;
            }

            started = true;
          }

          e.preventDefault();
          showTooltip(touchX);
        });
        this.$dom.addEventListener('touchend', function (e) {
          if (!started && !_this6.isChild) return;

          _this6.containerEmmiter.emit('tooltip-stopped', currentGlobalEvent);
        });
        document.body.addEventListener('touchstart', function (e) {
          if (!_this6.$dom.contains(e.target)) hideTooltip();
        });
        document.body.addEventListener('mousedown', function (e) {
          if (!_this6.$dom.contains(e.target)) {
            hideTooltip();
            pressed = false;
          }
        });
      }
    }]);

    return ChartLinesCanvas;
  }();

  var ChartLinesMap =
  /*#__PURE__*/
  function (_Renderer) {
    _inherits(ChartLinesMap, _Renderer);

    function ChartLinesMap(options) {
      var _this;

      _classCallCheck(this, ChartLinesMap);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(ChartLinesMap).call(this, options));
      _this.type = options.type;
      _this.height = options.height;
      options.containerEmmiter.on('line-toggle', function (id, state) {
        if (!_this.isRunning) return;

        _this.canvasLines[id].setVisibility(state);

        _this.calculateScaleCoef();
      });
      return _this;
    }

    _createClass(ChartLinesMap, [{
      key: "setData",
      value: function setData(data) {
        var _this2 = this;

        this.x = data.x;
        this.minX = this.x[0];
        this.maxX = this.x[this.x.length - 1];
        this.prevMaxDotValue = null;
        this.elements = [];
        var canvasLines = data.lines.reduce(function (result, line, i) {
          var canvasLine = new CanvasLine({
            zIndex: i + 10,
            height: _this2.height,
            maxDotPos: _this2.height * 0.95,
            topOffset: _this2.height * 0.05,
            color: line.color,
            width: 1,
            column: line.column,
            useToggleScaleAnimation: false
          });

          _this2.add(canvasLine);

          result[line.id] = canvasLine;
          return result;
        }, {});
        this.canvasLines = canvasLines;
      }
    }, {
      key: "start",
      value: function start(linesVisibility) {
        var _this3 = this;

        this.calculateScaleCoef(true);

        if (linesVisibility) {
          Object.keys(this.canvasLines).forEach(function (id) {
            _this3.canvasLines[id].setVisibility(linesVisibility[id], true);
          });
          this.calculateScaleCoef(true);
        }

        _get(_getPrototypeOf(ChartLinesMap.prototype), "start", this).call(this);
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        var _this4 = this;

        _get(_getPrototypeOf(ChartLinesMap.prototype), "setSize", this).call(this, width, height);

        if (!this.x) return;
        var xCoef = width / (this.maxX - this.minX);
        var calculatedX = this.x.map(function (value) {
          return (value - _this4.minX) * xCoef;
        });

        for (var id in this.canvasLines) {
          this.canvasLines[id].setCalculatedX(calculatedX, 0, calculatedX.length - 1);
        }
      }
    }, {
      key: "calculateScaleCoef",
      value: function calculateScaleCoef(isFirst) {
        if (this.type == 'lines_scaled') {
          for (var id in this.canvasLines) {
            this.canvasLines[id].calculateScaleCoef(this.canvasLines[id].maxValue, 0, isFirst);
          }

          this.needRedraw = true;
          return;
        }

        var maxDotValue = -Infinity;

        for (var _id in this.canvasLines) {
          var line = this.canvasLines[_id];
          if (!line.calculateInvolved) continue;
          maxDotValue = Math.max(line.maxValue, maxDotValue);
        }

        if (maxDotValue === this.prevMaxDotValue && !isFirst) return;
        this.prevMaxDotValue = maxDotValue;

        for (var _id2 in this.canvasLines) {
          this.canvasLines[_id2].calculateScaleCoef(maxDotValue, 0, isFirst);
        }

        this.needRedraw = true;
      }
    }]);

    return ChartLinesMap;
  }(Renderer);

  var ChartLines =
  /*#__PURE__*/
  function () {
    function ChartLines(options) {
      var _this = this;

      _classCallCheck(this, ChartLines);

      var sourceData = options.data;
      var data = handleInputData(sourceData);
      var globalEmmiter = options.globalEmmiter;
      var containerEmmiter = new Emmiter();
      this.containerEmmiter = containerEmmiter;
      var $dom = document.createElement('div');
      $dom.classList.add('container');
      this.$dom = $dom;
      var title = new Title({
        text: sourceData._title,
        containerEmmiter: containerEmmiter
      });
      $dom.appendChild(title.$dom);
      var $charts = document.createElement('div');
      $charts.className = 'container_charts';
      $dom.appendChild($charts);
      this.$charts = $charts;
      var $maps = document.createElement('div');
      $maps.className = 'container_maps';
      $dom.appendChild($maps);
      this.$maps = $maps; //
      // Main canvas
      //

      var mainCanvas = new ChartLinesCanvas({
        type: options.type,
        tooltipClickHandler: this.tooltipClickHandler.bind(this),
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $charts.appendChild(mainCanvas.$dom);
      mainCanvas.setData(data);
      mainCanvas.show();
      this.mainCanvas = mainCanvas; //
      // Child canvas
      //

      var childCanvas = new ChartLinesCanvas({
        type: options.type,
        isChild: true,
        isHidden: true,
        data: data,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      childCanvas.hide();
      $charts.appendChild(childCanvas.$dom);
      this.childCanvas = childCanvas; //
      // Main map
      //

      var mainChartLinesMap = new ChartLinesMap({
        type: options.type,
        height: 44,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      mainChartLinesMap.setData(data);
      this.chartLinesMap = mainChartLinesMap;
      var mainMap = new Map({
        height: 44,
        renderer: mainChartLinesMap,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $maps.appendChild(mainMap.$dom);
      this.mainMap = mainMap; //
      // Child map
      //

      var childChartLinesMap = new ChartLinesMap({
        type: options.type,
        height: 44,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      this.childChartLinesMap = childChartLinesMap;
      var childMap = new Map({
        isChild: true,
        height: 44,
        renderer: childChartLinesMap,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      childMap.hide();
      $maps.appendChild(childMap.$dom);
      this.childMap = childMap;
      var legend = new Legend({
        data: data,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(legend.$dom); // Load sub data in advance

      containerEmmiter.on('tooltip-stopped', function (index) {
        if (_this.chartType != 'main') return;
        options.dataLoader.getSub(options.type, data.x[index]);
      });
      this.type = options.type;
      this.dataLoader = options.dataLoader;
      var linesVisibility = data.lines.reduce(function (result, line, i) {
        result[line.id] = true;
        return result;
      }, {});
      this.linesVisibility = linesVisibility;
      this.chartType = 'main';
      containerEmmiter.on('line-toggle', function (id, state) {
        linesVisibility[id] = state;
      });
      containerEmmiter.on('main-chart', function () {
        _this.chartType = 'main';

        _this.childCanvas.hide();

        _this.childCanvas.prevDates = '';
        _this.childCanvas.prevRangeText = '';

        _this.childMap.hide();

        _this.mainCanvas.show(_this.linesVisibility);

        _this.mainMap.show(_this.linesVisibility);

        var childViewboxStart = _this.childMap.viewbox.start;
        var childViewboxLong = _this.childMap.viewbox.long;

        _this.containerEmmiter.emit('viewport-change', _this.lastMainViewport.start, _this.lastMainViewport.long);

        _this.containerEmmiter.emit('switch-title', false);

        _this.childMap.viewbox.start = childViewboxStart;
        _this.childMap.viewbox.long = childViewboxLong;

        _this.childMap.viewbox.calculateViewport();

        _this.childMap.overlay.start = childViewboxStart;
        _this.childMap.overlay.long = childViewboxLong;

        _this.childMap.overlay.calculateViewport();
      });
      containerEmmiter.on('chart-size-sets', function (height) {
        _this.$charts.style.height = height + 18 + 'px';
      });
    }

    _createClass(ChartLines, [{
      key: "tooltipClickHandler",
      value: function tooltipClickHandler(tooltip) {
        var _this2 = this;

        this.mainCanvas.$dom.style.transformOrigin = tooltip.position + 'px center';
        this.childCanvas.$dom.style.transformOrigin = tooltip.position + 'px center';
        var mapOrigin = Math.round((this.$dom.offsetWidth - 36) * (this.mainMap.viewbox.start + this.mainMap.viewbox.long / 2));
        var mapChildOrigin = Math.round((this.$dom.offsetWidth - 36) * (this.mainMap.viewbox.start + this.mainMap.viewbox.long));
        this.mainMap.$dom.style.transformOrigin = mapOrigin + 'px center';
        this.childMap.$dom.style.transformOrigin = mapChildOrigin + 'px center';
        this.chartType = 'child';
        this.lastMainViewport = {
          start: this.mainMap.viewbox.start,
          long: this.mainMap.viewbox.long
        };
        tooltip.$loader.style.display = 'block';
        this.dataLoader.getSub(this.type, tooltip.timestamp, function (subData) {
          tooltip.$loader.style.display = 'none';
          _this2.mainCanvas.tooltip.$dom.style.display = 'none';
          _this2.mainCanvas.chartTooltip.$dom.style.display = 'none';
          setTimeout(function () {
            tooltip.$dom.classList.remove('tooltip__loading');
          }, 0);

          _this2.mainCanvas.hide();

          _this2.mainCanvas.prevDates = '';
          _this2.mainCanvas.prevRangeText = '';

          _this2.mainMap.hide();

          var data = handleInputData(subData);

          _this2.childCanvas.setData(data);

          _this2.childCanvas.show(_this2.linesVisibility);

          _this2.childChartLinesMap.setData(data);

          _this2.childMap.show(_this2.linesVisibility);

          _this2.containerEmmiter.emit('viewport-change', 0.429, 0.142);

          _this2.containerEmmiter.emit('switch-title', true);

          _this2.mainMap.viewbox.start = _this2.lastMainViewport.start;
          _this2.mainMap.viewbox.long = _this2.lastMainViewport.long;

          _this2.mainMap.viewbox.calculateViewport();

          _this2.mainMap.overlay.start = _this2.lastMainViewport.start;
          _this2.mainMap.overlay.long = _this2.lastMainViewport.long;

          _this2.mainMap.overlay.calculateViewport();
        });
      }
    }]);

    return ChartLines;
  }();

  var ChartBarsRenderer =
  /*#__PURE__*/
  function (_Renderer) {
    _inherits(ChartBarsRenderer, _Renderer);

    function ChartBarsRenderer(options) {
      var _this;

      _classCallCheck(this, ChartBarsRenderer);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(ChartBarsRenderer).call(this, options));
      _this.type = options.type;
      _this.needRecalculateScaleCoef = true;
      _this.needRecalculateAsFirst = false;
      _this.prevMaxDotValue = null;
      _this.prevMinDotValue = null;
      _this.isSetScaleInstantly = false;
      _this.scaleUpdateTimeout = 0;
      _this.lastUpdateFired = 0;
      _this.lastRecalculatedFiredStart = 0;
      _this.lastRecalculatedFiredEnd = 0;
      _this.lastUpdateFiredStart = 0;
      _this.lastUpdateFiredEnd = 0;
      _this.containerEmmiter = options.containerEmmiter;
      return _this;
    }

    _createClass(ChartBarsRenderer, [{
      key: "start",
      value: function start() {
        this.calculateScaleCoef(true);

        _get(_getPrototypeOf(ChartBarsRenderer.prototype), "start", this).call(this);
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        _get(_getPrototypeOf(ChartBarsRenderer.prototype), "setSize", this).call(this, width, height);

        this.isSetScaleInstantly = true;
      }
    }, {
      key: "render",
      value: function render(delta) {
        if (this.needRecalculateScaleCoef) {
          this.calculateScaleCoef(this.needRecalculateAsFirst);
          this.needRecalculateAsFirst = false;
          this.needRecalculateScaleCoef = false;
          this.needRedraw = true;
        }

        _get(_getPrototypeOf(ChartBarsRenderer.prototype), "render", this).call(this, delta);
      }
    }, {
      key: "calculateScaleCoef",
      value: function calculateScaleCoef(isFirst) {
        var _this2 = this;

        var updateElementsScale = function updateElementsScale() {
          _this2.lastUpdateFired = performance.now();

          var maxDotValue = _this2.elements.reduce(function (result, element) {
            if (element.id != _this2.linesCount - 1) return result;
            var max = 0;

            for (var i = element.startIndex; i < element.endIndex + 1; i++) {
              var value = element.calculateInvolved ? element.column[i] : 0;
              var id = parseInt(element.id);

              while (id > 0) {
                id--;
                var bar = element.bars['y' + id];
                if (!bar.calculateInvolved) continue;
                value += bar.column[i];
              }

              max = Math.max(max, value);
            }

            return max;
          }, 0);

          if (!isFirst && maxDotValue === _this2.prevMaxDotValue) return;
          _this2.prevMaxDotValue = maxDotValue;

          _this2.elements.forEach(function (element) {
            if (element.type == 'axis-y') {
              element.calculateScaleCoef(maxDotValue, 0, isFirst);
            }
          });

          _this2.elements.forEach(function (element) {
            if (element.type == 'line') {
              element.calculateScaleCoef(maxDotValue, isFirst);
            }
          });

          _this2.lastUpdateFiredStart = _this2.lastRecalculatedFiredStart;
          _this2.lastUpdateFiredEnd = _this2.lastRecalculatedFiredEnd;
        };

        if (isFirst || this.isSetScaleInstantly) {
          this.isSetScaleInstantly = false;
          updateElementsScale();
          return;
        }

        updateElementsScale();
        var lastUpdatedChangeRange = 0.25 * (this.lastUpdateFiredEnd - this.lastUpdateFiredStart);
        var lastStartDelta = this.lastUpdateFiredStart - this.lastRecalculatedFiredStart;
        var lastEndDelta = this.lastUpdateFiredEnd - this.lastRecalculatedFiredEnd;

        if (Math.abs(lastStartDelta) > lastUpdatedChangeRange || Math.abs(lastEndDelta) > lastUpdatedChangeRange) {
          //updateElementsScale();
          this.containerEmmiter.emit('viewport-change-update');
        }
      }
    }]);

    return ChartBarsRenderer;
  }(Renderer);

  var CanvasBar =
  /*#__PURE__*/
  function () {
    function CanvasBar(options) {
      _classCallCheck(this, CanvasBar);

      this.type = 'line';
      this.zIndex = options.zIndex;
      this.needRedraw = false;
      this.calculateInvolved = true;
      this.id = options.id;
      this.height = options.height;
      this.color = Colors.get(options.color + ':line');
      this.width = options.width;
      this.column = options.column;
      this.maxValue = Math.max.apply(null, options.column);
      this.minValue = Math.min.apply(null, options.column);
      this.maxDotPos = options.maxDotPos;
      this.minDotPos = options.minDotPos || 0;
      this.topOffset = options.topOffset || 0;
      this.calculatedColumn = null;
      this.calculatedX = null;
      this.startIndex = 0;
      this.endIndex = 0;
      this.animationDuration = 300;
      this.useToggleScaleAnimation = options.useToggleScaleAnimation;
      this.scaleCoef = 0;
      this.currentScaleCoef = 0;
      this.scaleStep = 0;
    }

    _createClass(CanvasBar, [{
      key: "setAll",
      value: function setAll(bars, count) {
        this.bars = bars;
        this.barsCount = count;
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        this.height = height;
        this.maxDotPos = height - this.topOffset;
        this.calculateColumn();
      }
    }, {
      key: "calculateScaleCoef",
      value: function calculateScaleCoef(maxDotValue, isFirst) {
        var scaleCoef = (this.height - this.minDotPos - this.topOffset) / maxDotValue;
        if (!this.calculateInvolved) scaleCoef = 0;
        if (scaleCoef == this.scaleCoef) return;

        if (isFirst) {
          this.scaleCoef = this.currentScaleCoef = scaleCoef;
          this.calculateColumn();
          return;
        }

        var prevScaleCoef = this.currentScaleCoef;
        this.scaleCoef = scaleCoef;
        this.scaleStep = (this.scaleCoef - prevScaleCoef) / this.animationDuration;
        this.needRedraw = true;
      }
    }, {
      key: "calculateColumn",
      value: function calculateColumn() {
        var _this = this;

        this.calculatedColumn = this.column.slice(this.startIndex, this.endIndex + 1).map(function (value) {
          return value * _this.scaleCoef;
        });
      }
    }, {
      key: "setCalculatedX",
      value: function setCalculatedX(calculatedX, startIndex, endIndex) {
        this.calculatedX = calculatedX;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        var filteredColumn = this.column.slice(startIndex, endIndex + 1);
        this.maxValue = Math.max.apply(null, filteredColumn);
        this.minValue = Math.min.apply(null, filteredColumn);
        this.calculateColumn();
        this.needRedraw = true;
      }
    }, {
      key: "setVisibility",
      value: function setVisibility(state, isInstantly) {
        this.calculateInvolved = state;

        if (isInstantly) {
          //this.scaleCoef = this.currentScaleCoef = 0;
          //this.calculateColumn();
          this.needRedraw = true;
          return;
        } //const prevScaleCoef = this.currentScaleCoef;
        //this.scaleCoef = 0;
        //this.scaleStep = (this.scaleCoef - prevScaleCoef) / this.animationDuration;


        this.needRedraw = true;
      }
    }, {
      key: "getColumnValue",
      value: function getColumnValue(index) {
        var value = this.calculatedColumn[index];
        var id = parseInt(this.id);

        while (id > 0) {
          id--;
          var bar = this.bars['y' + id];
          value += bar.calculatedColumn[index];
        }

        return this.height - (value + this.minDotPos);
      }
      /**
       * Draw line
       *
       * @param   {CanvasRenderingContext2D}  context  2D canvas rendering context
       * @param   {Number}                    delta    Time from last draw in ms
       */

    }, {
      key: "draw",
      value: function draw(context, delta) {
        if (!this.calculatedX) return;
        var isAnimating = false;
        var calculatedColumn = null; // If scaling animated

        if (this.currentScaleCoef != this.scaleCoef) {
          // Calculate next intermediate scale value
          var nextScaleCoef = this.currentScaleCoef + this.scaleStep * delta; // If reached finish scale value

          if (this.scaleStep > 0 && nextScaleCoef >= this.scaleCoef || this.scaleStep < 0 && nextScaleCoef <= this.scaleCoef) {
            // Set finish value and disable redrawing
            this.currentScaleCoef = this.scaleCoef; // Calculate finish column values for caching

            this.calculateColumn();
            isAnimating = true;
          } else {
            // Calculate column values for current intermediate scale value
            this.calculatedColumn = this.column.slice(this.startIndex, this.endIndex + 1).map(function (value) {
              return value * nextScaleCoef;
            });
            this.currentScaleCoef = nextScaleCoef;
            isAnimating = true;
          }
        } // Get column values from cache if not set from intermediate scale value


        if (!calculatedColumn) calculatedColumn = this.calculatedColumn;
        this.needRedraw = isAnimating; // Setup draw styles

        context.globalCompositeOperation = 'destination-over';
        context.fillStyle = this.color.value;
        var barHalfWidth = (this.calculatedX[1] - this.calculatedX[0]) / 2; // Draw line

        context.beginPath(); // Left of first bar

        context.moveTo(this.calculatedX[0] - barHalfWidth, this.height - this.minDotPos);
        context.lineTo(this.calculatedX[0] - barHalfWidth, this.getColumnValue(0));
        var nextColumnValue = null;

        for (var _i = 0, l = calculatedColumn.length - 1; _i < l; _i++) {
          var columnValue = nextColumnValue !== null ? nextColumnValue : this.getColumnValue(_i);
          context.lineTo(this.calculatedX[_i] - barHalfWidth, columnValue);
          context.lineTo(this.calculatedX[_i] + barHalfWidth, columnValue);
          nextColumnValue = this.getColumnValue(_i + 1);
          context.lineTo(this.calculatedX[_i] + barHalfWidth, nextColumnValue);
        }

        var i = calculatedColumn.length - 1; // Last bar

        context.lineTo(this.calculatedX[i] - barHalfWidth, nextColumnValue);
        context.lineTo(this.calculatedX[i] + barHalfWidth, nextColumnValue);
        context.lineTo(this.calculatedX[i] + barHalfWidth, this.height - this.minDotPos);
        context.fill();
      }
    }]);

    return CanvasBar;
  }();

  var CanvasBarsTooltip =
  /*#__PURE__*/
  function () {
    function CanvasBarsTooltip(options) {
      _classCallCheck(this, CanvasBarsTooltip);

      this.zIndex = 998;
      this.minPos = options.minDotPos;
      this.color = Colors.get('TOOLTIP_MASK');
    }

    _createClass(CanvasBarsTooltip, [{
      key: "setCalculatedX",
      value: function setCalculatedX(calculatedX) {
        this.calculatedX = calculatedX;
        this.barHalfWidth = (calculatedX[1] - calculatedX[0]) / 2;
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        this.width = width;
        this.height = height;
      }
    }, {
      key: "setPos",
      value: function setPos(index) {
        this.index = index;
        this.needRedraw = true;
      }
    }, {
      key: "show",
      value: function show(index) {
        this.isVisible = true;
        this.setPos(index);
      }
    }, {
      key: "hide",
      value: function hide() {
        this.isVisible = false;
        this.needRedraw = true;
      }
    }, {
      key: "draw",
      value: function draw(context) {
        if (!this.isVisible) {
          this.needRedraw = false;
          return;
        }

        context.fillStyle = this.color.value;
        context.fillRect(0, 0, this.calculatedX[this.index] - this.barHalfWidth, this.height);
        context.fillRect(this.calculatedX[this.index] + this.barHalfWidth, 0, this.width, this.height);
        this.needRedraw = false;
      }
    }]);

    return CanvasBarsTooltip;
  }();

  var ChartLinesCanvas$1 =
  /*#__PURE__*/
  function () {
    function ChartLinesCanvas(options) {
      var _this = this;

      _classCallCheck(this, ChartLinesCanvas);

      this.type = options.type;
      this.isChild = options.isChild;
      this.overlayHeight = 20;
      this.width = 0;
      this.chartHeight = 0;
      this.lastInnerHeight = 0;
      this.viewportStart = options.viewportStart;
      this.viewportLong = options.viewportLong;
      this.colorLabelsAxisY = options.colorLabelsAxisY;
      this.colorLabelsAxisX = options.colorLabelsAxisX;
      var $dom = document.createElement('div');
      $dom.classList.add('chart');
      this.$dom = $dom;
      var globalEmmiter = options.globalEmmiter;
      this.globalEmmiter = options.globalEmmiter;
      var containerEmmiter = options.containerEmmiter;
      this.containerEmmiter = options.containerEmmiter;
      var $overlay = document.createElement('div');
      $overlay.className = 'overlay';
      $dom.appendChild($overlay);
      this.$overlay = $overlay;
      var renderer = new ChartBarsRenderer({
        type: options.type,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(renderer.$dom);
      this.renderer = renderer;
      var tooltip = new Tooltip({
        isHeaderLeft: this.isChild,
        showArrow: !options.isChild,
        countAll: this.type == 'bars',
        onclick: options.tooltipClickHandler,
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(tooltip.$dom);
      this.tooltip = tooltip;
      this.handleInteractive(); //
      // Dates range values
      //

      this.prevIsShortDates = window.innerWidth <= 400;
      this.prevRangeText = '';
      this.prevDates = '';
      this.switcherChangeTimeout;
      globalEmmiter.on('resize', function () {
        if (_this.isHidden) return;

        _this.calculateSize();
      });
      globalEmmiter.on('theme-change', function () {
        _this.$overlay.style.opacity = '0';
      });
      globalEmmiter.on('theme-changed', function () {
        _this.$overlay.style.opacity = '1';
      });
      containerEmmiter.on('line-toggle', function (id, state) {
        if (_this.isHidden || !_this.isDataSetted) return;

        _this.canvasLines[id].setVisibility(state);

        renderer.needRecalculateScaleCoef = true;
        renderer.isSetScaleInstantly = true;
        setTimeout(function () {
          tooltip.toggleElement(id, state);
        }, 175);
      });
      containerEmmiter.on('viewport-change', function (start, long) {
        if (_this.isHidden || !_this.isDataSetted) return;
        _this.viewportStart = start;
        _this.viewportLong = long;

        _this.calculateViewport();
      });
      containerEmmiter.on('viewport-change-update', function () {
        if (_this.isHidden || !_this.isDataSetted) return;

        _this.calculateRangeDates(true);
      });
    }

    _createClass(ChartLinesCanvas, [{
      key: "setData",
      value: function setData(data) {
        var _this2 = this;

        this.isDataSetted = true;
        this.x = data.x;
        this.lines = data.lines;
        this.minX = this.x[0];
        this.maxX = this.x[this.x.length - 1];
        this.renderer.elements = [];
        var canvasLines = data.lines.slice().reverse().reduce(function (result, line, i) {
          var canvasLine = new CanvasBar({
            id: line.id.substr(1),
            zIndex: i + 10,
            minDotPos: 21,
            topOffset: _this2.overlayHeight,
            color: line.color,
            width: 2,
            column: line.column,
            useToggleScaleAnimation: true
          });

          if (data.linesVisibility && !data.linesVisibility[line.id]) {
            canvasLine.setVisibility(false, true);
          }

          _this2.renderer.add(canvasLine);

          result[line.id] = canvasLine;
          return result;
        }, {});
        this.canvasLines = canvasLines;

        for (var id in canvasLines) {
          canvasLines[id].setAll(canvasLines, data.lines.length);
        }

        this.renderer.linesCount = data.lines.length;
        var chartTooltip = new CanvasBarsTooltip({
          minDotPos: 21
        });
        this.renderer.add(chartTooltip);
        this.chartTooltip = chartTooltip;
        var canvasAxisX = new CanvasAxisX({
          labelsColor: this.colorLabelsAxisX,
          containerEmmiter: this.containerEmmiter
        });
        this.renderer.add(canvasAxisX);
        this.canvasAxisX = canvasAxisX;
        var canvasAxisY = new CanvasAxisY({
          isLineTop: true,
          overlayHeight: this.overlayHeight,
          minDotPos: 21,
          labelsColor: this.colorLabelsAxisY
        });
        this.renderer.add(canvasAxisY);
        this.canvasAxisX.setData(data.x);
        this.tooltip.setInitData(data.lines);
      }
    }, {
      key: "hide",
      value: function hide() {
        var _this3 = this;

        this.isHidden = true;
        this.renderer.stop();
        if (this.isChild) this.$dom.classList.add('chart__child-hide');else this.$dom.classList.add('chart__main-hide');
        setTimeout(function () {
          _this3.$dom.style.display = 'none';
        }, 325);
      }
    }, {
      key: "show",
      value: function show(linesVisibility) {
        var _this4 = this;

        this.isHidden = false;
        this.$dom.style.display = 'block';
        setTimeout(function () {
          if (_this4.isChild) _this4.$dom.classList.remove('chart__child-hide');else _this4.$dom.classList.remove('chart__main-hide');
        }, 0);

        if (linesVisibility) {
          Object.keys(this.canvasLines).forEach(function (id) {
            _this4.canvasLines[id].setVisibility(linesVisibility[id], true);

            _this4.tooltip.toggleElement(id, linesVisibility[id]);
          });
        }

        setTimeout(function () {
          _this4.calculateSize(true);

          _this4.renderer.start();
        }, 0);
      }
    }, {
      key: "calculateRangeDates",
      value: function calculateRangeDates(isInstantly) {
        var _this5 = this;

        var dates = this.x[this.startIndex] + '-' + this.x[this.endIndex];
        if (this.prevDates == dates && !isInstantly) return;

        if (isInstantly) {
          clearTimeout(this.switcherChangeTimeout);
          var rangeText = generateRangeText(this.x[this.startIndex], this.x[this.endIndex]);
          if (rangeText == this.prevRangeText) return;
          this.containerEmmiter.emit('viewport-range-text', rangeText, dates < this.prevDates);
          this.prevRangeText = rangeText;
          this.prevDates = dates;
          return;
        }

        var isShortDates = window.innerWidth <= 400;

        if (isShortDates != this.prevIsShortDates) {
          this.prevIsShortDates = isShortDates;

          var _rangeText = generateRangeText(this.x[this.startIndex], this.x[this.endIndex]);

          if (_rangeText == this.prevRangeText) return;
          this.containerEmmiter.emit('viewport-range-text', _rangeText, dates < this.prevDates, true);
          this.prevRangeText = _rangeText;
          this.prevDates = dates;
          return;
        }

        clearTimeout(this.switcherChangeTimeout);
        this.switcherChangeTimeout = setTimeout(function () {
          var rangeText = generateRangeText(_this5.x[_this5.startIndex], _this5.x[_this5.endIndex]);
          if (rangeText == _this5.prevRangeText) return;

          _this5.containerEmmiter.emit('viewport-range-text', rangeText, dates < _this5.prevDates);

          _this5.prevRangeText = rangeText;
          _this5.prevDates = dates;
        }, this.prevRangeText != '' ? 150 : 0);
      }
    }, {
      key: "calculateViewport",
      value: function calculateViewport(isFirst) {
        var width = this.width || 1;
        var fullWidth = width / this.viewportLong;
        var fixViewportStart = this.viewportStart - 18 / fullWidth;
        var fixViewportLong = this.viewportLong + 36 / fullWidth;
        var startIndex = Math.floor(fixViewportStart * this.x.length) - 1;
        var endIndex = Math.ceil((fixViewportStart + fixViewportLong) * this.x.length) + 2;
        if (startIndex < 0) startIndex = 0;
        if (endIndex > this.x.length - 1) endIndex = this.x.length - 1;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        var rangeX = this.maxX - this.minX;
        var minViewX = rangeX * fixViewportStart + this.minX;
        var fixCoef = width / (rangeX * fixViewportLong);
        this.calculatedX = this.x.slice(startIndex, endIndex + 1).map(function (value) {
          return (value - minViewX) * fixCoef;
        });
        /*const barHalfWidth = (this.calculatedX[1] - this.calculatedX[0]) / 2;
        const halfSize = this.calculatedX.length / 2;
          this.calculatedX = this.calculatedX.map((value, i) => {
          if(i < halfSize) {
            value += barHalfWidth * i / halfSize;
          }
          if(i > halfSize) {
            value -= barHalfWidth * (halfSize - i) / halfSize;
          }
            return value;
        });*/
        //
        // Calculate viewport range text for chart title
        //

        this.calculateRangeDates(); //
        // Set calculatedX to elements
        //

        for (var id in this.canvasLines) {
          this.canvasLines[id].setCalculatedX(this.calculatedX, startIndex, endIndex);
        }

        this.chartTooltip.setCalculatedX(this.calculatedX);
        this.canvasAxisX.calculatedX = this.calculatedX;
        this.canvasAxisX.calculateViewport(isFirst, this.viewportStart, this.viewportLong, startIndex, endIndex);
        this.renderer.needRecalculateAsFirst = isFirst;
        this.renderer.needRecalculateScaleCoef = true;
        this.renderer.lastRecalculatedFiredStart = startIndex;
        this.renderer.lastRecalculatedFiredEnd = endIndex;
        this.renderer.needRedraw = true;
      }
    }, {
      key: "calculateSize",
      value: function calculateSize(isFirst) {
        var isWidthChanged = false;
        var isHeightChanged = false; //
        // Width part
        //

        var $dom = this.$dom;
        var width = $dom.offsetWidth;

        if (this.tooltip.isVisible) {
          this.tooltip.isVisible = false;
          this.tooltip.show(this.tooltip.lastPosition * width / this.width);
        }

        if (width != this.width || isFirst) {
          isWidthChanged = true;
          this.width = width;
          this.calculateViewport(isFirst);
        } //
        // Height part
        //


        var windowHeight = innerHeight;
        var chartHeight = this.chartHeight; // Handle only height changes > 10%

        var heightChangePerc = Math.abs(windowHeight - this.lastInnerHeight) / this.lastInnerHeight;

        if (heightChangePerc > 0.2) {
          this.lastInnerHeight = windowHeight;
          var isMobile = detectMobile();

          if (isMobile) {
            chartHeight = windowHeight * 0.5;
          } else {
            chartHeight = windowHeight * 0.3;
          }

          chartHeight = Math.round(chartHeight);
          if (chartHeight < 300) chartHeight = 300;

          if (chartHeight != this.chartHeight || isFirst) {
            isHeightChanged = true;
            this.chartHeight = chartHeight;
            this.renderer.needRecalculateAsFirst = true;
            this.renderer.needRecalculateScaleCoef = true;
            this.renderer.needRedraw = true;
          }
        }

        if (!isWidthChanged && !isHeightChanged) return; //
        // Set calculated values
        //

        this.chartTooltip.setSize(width, chartHeight);
        this.tooltip.setSize(width, chartHeight);
        this.tooltipVisible = false;
        this.renderer.setSize(width, chartHeight);
        this.containerEmmiter.emit('chart-size-sets', chartHeight);
      }
    }, {
      key: "handleInteractive",
      value: function handleInteractive() {
        var _this6 = this;

        this.tooltipVisible = false;
        var prevIndex = null;
        var currentGlobalEvent = null;

        var showTooltip = function showTooltip(x) {
          var xPos = x;
          var offset = _this6.calculatedX[0];

          var calcX = _this6.calculatedX.map(function (pos) {
            return pos - offset;
          });

          var index = Math.round((xPos - offset) / ((calcX[calcX.length - 1] - calcX[0]) / (calcX.length - 1)));
          if (index < 0) index = 0;

          if (index > _this6.calculatedX.length - 1) {
            index = _this6.calculatedX.length - 1;
          }

          if (index === prevIndex && _this6.tooltipVisible) return; // Not get elements out of viewport

          if (_this6.calculatedX[index] <= 0 || _this6.calculatedX[index] >= _this6.width) {
            var dir = _this6.calculatedX[index] <= 0 ? 1 : -1;

            for (var i = index + dir; true; i += dir) {
              if (_this6.calculatedX[i] > 0 && _this6.calculatedX[i] < _this6.width) {
                index = i;
                break;
              }
            }
          }

          var values = {};

          _this6.lines.forEach(function (line) {
            values[line.id] = line.column[_this6.startIndex + index];
          });

          var range = _this6.x[_this6.endIndex] - _this6.x[_this6.startIndex];

          _this6.tooltip.setData({
            timestamp: _this6.x[_this6.startIndex + index],
            values: values,
            dir: index < prevIndex,
            isInstantly: !_this6.tooltipVisible,
            range: range
          });

          if (!_this6.tooltipVisible) {
            _this6.chartTooltip.show(index);

            _this6.tooltip.show(_this6.calculatedX[index]);
          } else {
            _this6.chartTooltip.setPos(index);

            _this6.tooltip.setPos(_this6.calculatedX[index]);
          }

          prevIndex = index;
          currentGlobalEvent = _this6.startIndex + index;
          _this6.tooltipVisible = true;
        };

        var hideTooltip = function hideTooltip() {
          if (!_this6.tooltipVisible) return;

          _this6.chartTooltip.hide();

          _this6.tooltip.hide();

          _this6.tooltipVisible = false;
        };

        var startTouchX = 0;
        var startTouchY = 0;
        var touchShowTimeout = 0;
        var started = false;
        var disabled = false;
        var pressed = false;
        this.$dom.addEventListener('mousedown', function (e) {
          if (_this6.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          pressed = true;
          showTooltip(e.pageX - rect.left);
        });
        this.$dom.addEventListener('mousemove', function (e) {
          if (!pressed) return; //if(this.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          showTooltip(e.pageX - rect.left);
        });
        document.body.addEventListener('mouseleave', function () {
          if (pressed && !_this6.isChild) {
            _this6.containerEmmiter.emit('tooltip-stopped', currentGlobalEvent);
          }

          pressed = false;
        });
        document.body.addEventListener('mouseup', function () {
          if (pressed && !_this6.isChild) {
            _this6.containerEmmiter.emit('tooltip-stopped', currentGlobalEvent);
          }

          pressed = false;
        });
        this.$dom.addEventListener('touchstart', function (e) {
          if (_this6.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          startTouchX = e.touches[0].pageX - rect.left;
          startTouchY = e.touches[0].pageY - rect.top;
          started = false;
          disabled = false;
          touchShowTimeout = setTimeout(function () {
            started = true;
            showTooltip(startTouchX);
          }, 300);
        });
        this.$dom.addEventListener('touchmove', function (e) {
          if (disabled) return; //if(this.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          var touchX = e.touches[0].pageX - rect.left;

          if (!started) {
            var touchY = e.touches[0].pageY - rect.top;
            var lengthX = Math.abs(touchX - startTouchX);
            var lengthY = Math.abs(touchY - startTouchY);

            if (lengthY > lengthX) {
              clearTimeout(touchShowTimeout);
              disabled = true;
              hideTooltip();
              return;
            }

            started = true;
          }

          e.preventDefault();
          showTooltip(touchX);
        });
        this.$dom.addEventListener('touchend', function () {
          if (!started && !_this6.isChild) return;

          _this6.containerEmmiter.emit('tooltip-stopped', currentGlobalEvent);
        });
        document.body.addEventListener('touchstart', function (e) {
          if (!_this6.$dom.contains(e.target)) hideTooltip();
        });
        document.body.addEventListener('mousedown', function (e) {
          if (!_this6.$dom.contains(e.target)) {
            hideTooltip();
            pressed = false;
          }
        });
      }
    }]);

    return ChartLinesCanvas;
  }();

  var ChartBarsMap =
  /*#__PURE__*/
  function (_Renderer) {
    _inherits(ChartBarsMap, _Renderer);

    function ChartBarsMap(options) {
      var _this;

      _classCallCheck(this, ChartBarsMap);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(ChartBarsMap).call(this, options));
      _this.type = options.type;
      _this.height = options.height;
      options.containerEmmiter.on('line-toggle', function (id, state) {
        if (!_this.isRunning) return;

        _this.canvasLines[id].setVisibility(state);

        _this.calculateScaleCoef();
      });
      return _this;
    }

    _createClass(ChartBarsMap, [{
      key: "setData",
      value: function setData(data) {
        var _this2 = this;

        this.x = data.x;
        this.minX = this.x[0];
        this.maxX = this.x[this.x.length - 1];
        this.prevMaxDotValue = null;
        this.elements = [];
        var canvasLines = data.lines.slice().reverse().reduce(function (result, line, i) {
          var canvasLine = new CanvasBar({
            id: line.id.substr(1),
            zIndex: i + 10,
            height: _this2.height,
            maxDotPos: _this2.height * 0.95,
            topOffset: _this2.height * 0.05,
            color: line.color,
            width: 1,
            column: line.column,
            useToggleScaleAnimation: false
          });

          _this2.add(canvasLine);

          result[line.id] = canvasLine;
          return result;
        }, {});
        this.canvasLines = canvasLines;

        for (var id in canvasLines) {
          canvasLines[id].setAll(canvasLines, data.lines.length);
        }

        this.linesCount = data.lines.length;
      }
    }, {
      key: "start",
      value: function start(linesVisibility) {
        var _this3 = this;

        this.calculateScaleCoef(true);

        if (linesVisibility) {
          Object.keys(this.canvasLines).forEach(function (id) {
            _this3.canvasLines[id].setVisibility(linesVisibility[id], true);
          });
          this.calculateScaleCoef(true);
        }

        _get(_getPrototypeOf(ChartBarsMap.prototype), "start", this).call(this);
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        var _this4 = this;

        _get(_getPrototypeOf(ChartBarsMap.prototype), "setSize", this).call(this, width, height);

        if (!this.x) return;
        var xCoef = width / (this.maxX - this.minX);
        var calculatedX = this.x.map(function (value) {
          return (value - _this4.minX) * xCoef;
        });

        for (var id in this.canvasLines) {
          this.canvasLines[id].setCalculatedX(calculatedX, 0, calculatedX.length - 1);
        }
      }
    }, {
      key: "calculateScaleCoef",
      value: function calculateScaleCoef(isFirst) {
        var _this5 = this;

        var maxDotValue = this.elements.reduce(function (result, element) {
          if (element.id != _this5.linesCount - 1) return result;
          var max = 0;

          for (var i = element.startIndex; i < element.endIndex + 1; i++) {
            var value = element.column[i];
            var id = parseInt(element.id);

            while (id > 0) {
              id--;
              var bar = element.bars['y' + id];
              if (!bar.calculateInvolved) continue;
              value += bar.column[i];
            }

            max = Math.max(max, value);
          }

          return max;
        }, 0);
        if (maxDotValue === this.prevMaxDotValue && !isFirst) return;
        this.prevMaxDotValue = maxDotValue;

        for (var id in this.canvasLines) {
          this.canvasLines[id].calculateScaleCoef(maxDotValue, isFirst);
        }

        this.needRedraw = true;
      }
    }]);

    return ChartBarsMap;
  }(Renderer);

  var ChartBars =
  /*#__PURE__*/
  function () {
    function ChartBars(options) {
      var _this = this;

      _classCallCheck(this, ChartBars);

      var sourceData = options.data;
      var data = handleInputData(sourceData);
      var globalEmmiter = options.globalEmmiter;
      var containerEmmiter = new Emmiter();
      this.globalEmmiter = options.globalEmmiter;
      this.containerEmmiter = containerEmmiter;
      var $dom = document.createElement('div');
      $dom.classList.add('container');
      this.$dom = $dom;
      var title = new Title({
        text: sourceData._title,
        containerEmmiter: containerEmmiter
      });
      $dom.appendChild(title.$dom);
      var $charts = document.createElement('div');
      $charts.className = 'container_charts';
      $dom.appendChild($charts);
      this.$charts = $charts;
      var $maps = document.createElement('div');
      $maps.className = 'container_maps';
      $dom.appendChild($maps);
      this.$maps = $maps; //
      // Main canvas
      //

      var mainCanvas = new ChartLinesCanvas$1({
        type: options.type,
        tooltipClickHandler: this.tooltipClickHandler.bind(this),
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $charts.appendChild(mainCanvas.$dom);
      mainCanvas.setData(data);
      mainCanvas.show();
      this.mainCanvas = mainCanvas; //
      // Child canvas
      //

      var childCanvas;

      if (options.type == 'bars') {
        childCanvas = new ChartLinesCanvas$1({
          type: options.type,
          isChild: true,
          isHidden: true,
          data: data,
          colorLabelsAxisY: options.colorLabelsAxisY,
          colorLabelsAxisX: options.colorLabelsAxisX,
          containerEmmiter: containerEmmiter,
          globalEmmiter: globalEmmiter
        });
      } else {
        childCanvas = new ChartLinesCanvas({
          type: 'lines',
          isChild: true,
          isHidden: true,
          data: data,
          colorLabelsAxisY: options.colorLabelsAxisY,
          colorLabelsAxisX: options.colorLabelsAxisX,
          containerEmmiter: containerEmmiter,
          globalEmmiter: globalEmmiter,
          isBarsSingleChild: true
        });
      }

      childCanvas.hide();
      $charts.appendChild(childCanvas.$dom);
      this.childCanvas = childCanvas; //
      // Main map
      //

      var mainChartLinesMap = new ChartBarsMap({
        type: options.type,
        height: 44,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      mainChartLinesMap.setData(data);
      this.chartLinesMap = mainChartLinesMap;
      var mainMap = new Map({
        height: 44,
        renderer: mainChartLinesMap,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $maps.appendChild(mainMap.$dom);
      this.mainMap = mainMap; //
      // Child map
      //

      if (options.type == 'bars') {
        var childChartLinesMap = new ChartBarsMap({
          type: options.type,
          height: 44,
          containerEmmiter: containerEmmiter,
          globalEmmiter: globalEmmiter
        });
        this.childChartLinesMap = childChartLinesMap;
        var childMap = new Map({
          isChild: true,
          height: 44,
          renderer: childChartLinesMap,
          containerEmmiter: containerEmmiter,
          globalEmmiter: globalEmmiter
        });
        childMap.hide();
        $maps.appendChild(childMap.$dom);
        this.childMap = childMap;
      }

      if (options.type == 'bars') {
        var legend = new Legend({
          data: data,
          containerEmmiter: containerEmmiter,
          globalEmmiter: globalEmmiter
        });
        $dom.appendChild(legend.$dom);
      } // Load sub data in advance


      containerEmmiter.on('tooltip-stopped', function (index) {
        if (_this.chartType != 'main') return;
        options.dataLoader.getSub(options.type, data.x[index]);
      });
      this.type = options.type;
      this.dataLoader = options.dataLoader;
      var linesVisibility = data.lines.reduce(function (result, line) {
        result[line.id] = true;
        return result;
      }, {});
      this.linesVisibility = linesVisibility;
      this.chartType = 'main';
      containerEmmiter.on('line-toggle', function (id, state) {
        linesVisibility[id] = state;
      });
      containerEmmiter.on('main-chart', function () {
        _this.chartType = 'main';

        if (_this.childLegend) {
          _this.childLegend.$dom.classList.add('legend__hidden');

          setTimeout(function () {
            _this.$maps.removeChild(_this.childLegend.$dom);

            delete _this.childLegend;
          }, 325);
        }

        _this.childCanvas.hide();

        _this.childCanvas.prevDates = '';
        _this.childCanvas.prevRangeText = '';

        _this.mainCanvas.show(_this.linesVisibility);

        _this.mainMap.show(_this.linesVisibility);

        if (_this.type == 'bars') {
          _this.childMap.hide();

          var childViewboxStart = _this.childMap.viewbox.start;
          var childViewboxLong = _this.childMap.viewbox.long;

          _this.containerEmmiter.emit('viewport-change', _this.lastMainViewport.start, _this.lastMainViewport.long);

          _this.childMap.viewbox.start = childViewboxStart;
          _this.childMap.viewbox.long = childViewboxLong;

          _this.childMap.viewbox.calculateViewport();

          _this.childMap.overlay.start = childViewboxStart;
          _this.childMap.overlay.long = childViewboxLong;

          _this.childMap.overlay.calculateViewport();
        }

        _this.containerEmmiter.emit('switch-title', false);
      });
      containerEmmiter.on('chart-size-sets', function (height) {
        _this.$charts.style.height = height + 18 + 'px';
      });
    }

    _createClass(ChartBars, [{
      key: "tooltipClickHandler",
      value: function tooltipClickHandler(tooltip) {
        var _this2 = this;

        this.mainCanvas.$dom.style.transformOrigin = tooltip.position + 'px center';
        this.childCanvas.$dom.style.transformOrigin = tooltip.position + 'px center';
        var mapOrigin = Math.round((this.$dom.offsetWidth - 36) * (this.mainMap.viewbox.start + this.mainMap.viewbox.long / 2));
        var mapChildOrigin = Math.round((this.$dom.offsetWidth - 36) * (this.mainMap.viewbox.start + this.mainMap.viewbox.long));

        if (this.type == 'bars') {
          this.mainMap.$dom.style.transformOrigin = mapOrigin + 'px center';
          this.childMap.$dom.style.transformOrigin = mapChildOrigin + 'px center';
        }

        this.chartType = 'child';
        this.lastMainViewport = {
          start: this.mainMap.viewbox.start,
          long: this.mainMap.viewbox.long
        };
        tooltip.$loader.style.display = 'block';
        this.dataLoader.getSub(this.type, tooltip.timestamp, function (subData) {
          tooltip.$loader.style.display = 'none';
          _this2.mainCanvas.tooltip.$dom.style.display = 'none';
          setTimeout(function () {
            tooltip.$dom.classList.remove('tooltip__loading');
          }, 0);
          var linesVisibility = _this2.linesVisibility;
          if (_this2.type != 'bars') linesVisibility = null;

          _this2.mainCanvas.hide();

          _this2.mainCanvas.prevDates = '';
          _this2.mainCanvas.prevRangeText = '';

          _this2.mainMap.hide(_this2.type != 'bars');

          var data = handleInputData(subData);

          if (_this2.type != 'bars') {
            var legend = new Legend({
              data: data,
              containerEmmiter: _this2.containerEmmiter,
              globalEmmiter: _this2.globalEmmiter
            });
            legend.$dom.classList.add('legend__hidden');

            _this2.$maps.appendChild(legend.$dom);

            _this2.childLegend = legend;
            setTimeout(function () {
              legend.$dom.classList.remove('legend__hidden');
            }, 0);
          }

          _this2.childCanvas.setData(data);

          _this2.childCanvas.show(linesVisibility);

          if (_this2.type == 'bars') {
            _this2.childChartLinesMap.setData(data);

            _this2.childMap.show(linesVisibility);
          }

          if (_this2.type == 'bars') {
            _this2.containerEmmiter.emit('viewport-change', 0.429, 0.142);
          } else {
            _this2.containerEmmiter.emit('viewport-change', 0, 1);
          }

          _this2.containerEmmiter.emit('switch-title', true);

          _this2.mainMap.viewbox.start = _this2.lastMainViewport.start;
          _this2.mainMap.viewbox.long = _this2.lastMainViewport.long;

          _this2.mainMap.viewbox.calculateViewport();

          _this2.mainMap.overlay.start = _this2.lastMainViewport.start;
          _this2.mainMap.overlay.long = _this2.lastMainViewport.long;

          _this2.mainMap.overlay.calculateViewport();
        });
      }
    }]);

    return ChartBars;
  }();

  var ChartPercentsTooltip =
  /*#__PURE__*/
  function () {
    function ChartPercentsTooltip(options) {
      var _this = this;

      _classCallCheck(this, ChartPercentsTooltip);

      this.globalEmmiter = options.globalEmmiter;
      var $dom = document.createElement('div');
      $dom.className = 'tooltip-lines';
      $dom.style.top = '8%';
      this.$dom = $dom;
      this.prevIndex = null;
      this.step = 0;
      this.dir = 0;
      this.x = 0;
      this.startX = 0;
      this.endX = 0;
      this.prevWidth = 0;
      this.prevHeight = 0;
      options.globalEmmiter.on('render', function (delta) {
        if (_this.step == 0) return;
        var deltaX = _this.step * _this.dir * delta;
        var newX = _this.x + deltaX;

        if (_this.dir == -1 && newX < _this.endX) {
          newX = _this.endX;
          _this.step = 0;
        }

        if (_this.dir == 1 && newX > _this.endX) {
          newX = _this.endX;
          _this.step = 0;
        }

        _this.x = newX;
        _this.$dom.style.transform = 'translateX(' + newX + 'px)';
      });
      this.hideTimeout = null;
    }

    _createClass(ChartPercentsTooltip, [{
      key: "setData",
      value: function setData() {
        this.$dom.innerHTML = '<div class="tooltip-lines_line"></div>';
      }
    }, {
      key: "setPos",
      value: function setPos(x, index, isFirst) {
        if (this.prevIndex === index && !isFirst) return;
        this.prevIndex = index;

        if (isFirst) {
          this.x = x;
          this.$dom.style.transform = 'translateX(' + x + 'px)';
          return;
        }

        if (!this.x) this.x = x;
        this.startX = this.x;
        this.endX = x;
        this.step = Math.abs(this.x - x) / 150;
        this.dir = this.x - x < 0 ? 1 : -1;
      }
    }, {
      key: "show",
      value: function show(x, index) {
        clearTimeout(this.hideTimeout);
        this.$dom.style.display = 'block';
        this.$dom.style.opacity = '1';
        this.setPos(x, index, true);
      }
    }, {
      key: "hide",
      value: function hide() {
        var _this2 = this;

        this.$dom.style.opacity = '0';
        this.hideTimeout = setTimeout(function () {
          _this2.$dom.style.display = 'none';
        }, 175);
      }
    }, {
      key: "setSize",
      value: function setSize() {
        this.hide();
      }
    }]);

    return ChartPercentsTooltip;
  }();

  var ChartPercentsRenderer =
  /*#__PURE__*/
  function (_Renderer) {
    _inherits(ChartPercentsRenderer, _Renderer);

    function ChartPercentsRenderer(options) {
      var _this;

      _classCallCheck(this, ChartPercentsRenderer);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(ChartPercentsRenderer).call(this, options));
      _this.type = options.type;
      _this.needRecalculateScaleCoef = true;
      _this.needRecalculateAsFirst = false;
      _this.prevMaxDotValue = null;
      _this.prevMinDotValue = null;
      _this.isSetScaleInstantly = false;
      _this.lastUpdateFired = 0;
      _this.lastRecalculatedFiredStart = 0;
      _this.lastRecalculatedFiredEnd = 0;
      _this.lastUpdateFiredStart = 0;
      _this.lastUpdateFiredEnd = 0;
      _this.containerEmmiter = options.containerEmmiter;
      return _this;
    }

    _createClass(ChartPercentsRenderer, [{
      key: "start",
      value: function start() {
        this.calculateScaleCoef(true);

        _get(_getPrototypeOf(ChartPercentsRenderer.prototype), "start", this).call(this);
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        _get(_getPrototypeOf(ChartPercentsRenderer.prototype), "setSize", this).call(this, width, height);

        this.isSetScaleInstantly = true;
      }
    }, {
      key: "render",
      value: function render(delta) {
        if (this.needRecalculateScaleCoef) {
          this.calculateScaleCoef(this.needRecalculateAsFirst);
          this.needRecalculateAsFirst = false;
          this.needRecalculateScaleCoef = false;
          this.needRedraw = true;
        }

        this.elements.forEach(function (element) {
          if (element.update) element.update(delta);
        });

        _get(_getPrototypeOf(ChartPercentsRenderer.prototype), "render", this).call(this, delta);
      }
    }, {
      key: "calculateScaleCoef",
      value: function calculateScaleCoef(isFirst) {
        this.elements.forEach(function (element) {
          if (element.type == 'axis-y') {
            element.calculateScaleCoef(106, 0, isFirst);
          }
        });
        this.elements.forEach(function (element) {
          if (element.type == 'line') {
            element.calculateScaleCoef(106, isFirst);
          }
        });
        var lastUpdatedChangeRange = 0.25 * (this.lastUpdateFiredEnd - this.lastUpdateFiredStart);

        if (Math.abs(this.lastUpdateFiredStart - this.lastRecalculatedFiredStart) > lastUpdatedChangeRange || Math.abs(this.lastUpdateFiredEnd - this.lastRecalculatedFiredEnd) > lastUpdatedChangeRange) {
          this.containerEmmiter.emit('viewport-change-update');
          this.lastUpdateFiredStart = this.lastRecalculatedFiredStart;
          this.lastUpdateFiredEnd = this.lastRecalculatedFiredEnd;
        }
      }
    }]);

    return ChartPercentsRenderer;
  }(Renderer);

  var CanvasPercent =
  /*#__PURE__*/
  function () {
    function CanvasPercent(options) {
      var _this = this;

      _classCallCheck(this, CanvasPercent);

      this.type = 'line';
      this.zIndex = options.zIndex;
      this.needRedraw = false;
      this.calculateInvolved = true;
      this.id = options.id;
      this.height = options.height;
      this.color = Colors.get(options.color + ':line');
      this.width = options.width;
      this.column = options.column;
      this.currentColumn = options.column;
      this.fromColumn = options.column;
      this.toColumn = options.column;
      var emptyColumn = [];

      for (var i = 0, l = options.column.length; i < l; i++) {
        emptyColumn.push(0);
      }

      this.emptyColumn = emptyColumn;
      this.maxValue = Math.max.apply(null, options.column);
      this.minValue = Math.min.apply(null, options.column);
      this.maxDotPos = options.maxDotPos;
      this.minDotPos = options.minDotPos || 0;
      this.topOffset = options.topOffset || 0;
      this.calculatedColumn = null;
      this.calculatedX = null;
      this.startIndex = 0;
      this.endIndex = 0;
      this.animationDuration = 300;
      this.useToggleScaleAnimation = options.useToggleScaleAnimation;
      this.scaleCoef = 0;
      this.currentScaleCoef = 0;
      this.scaleStep = 0;
      this.calculateInvolved = true;
      this.nextCalculateInvolved = true;
      this.prevIsAnimating = false;
      options.containerEmmiter.on('perc-summ-change', function (percSumm, isAnimating) {
        _this.percSumm = percSumm;
        _this.isAnimatingOther = isAnimating;

        _this.calculateColumn();
      });
    }

    _createClass(CanvasPercent, [{
      key: "setAll",
      value: function setAll(lines) {
        this.lines = lines;
      }
      /*setPercentsSumm(percSumm) {
        if(!this.currentPercSumm) {
          this.currentPercSumm = percSumm;
          return;
        }
          if(!this.prevPercSumm) this.prevPercSumm = this.currentPercSumm;
          if(!this.needPercSumm) this.needPercSumm = percSumm;
          this.isAnimatePercSumm = true;
        this.animatePercSummTimer = 0;
      }*/

    }, {
      key: "setSize",
      value: function setSize(width, height) {
        this.height = height;
        this.maxDotPos = height - this.topOffset;
        this.calculateColumn();
      }
    }, {
      key: "calculateScaleCoef",
      value: function calculateScaleCoef(maxDotValue) {
        var scaleCoef = (this.height - this.minDotPos - this.topOffset) / maxDotValue;
        if (scaleCoef == this.scaleCoef) return;
        this.scaleCoef = this.currentScaleCoef = scaleCoef;
        this.calculateColumn();
        this.needRedraw = true;
      }
    }, {
      key: "calculateColumn",
      value: function calculateColumn() {
        var _this2 = this;

        this.calculatedColumn = this.currentColumn.slice(this.startIndex, this.endIndex + 1).map(function (value, i) {
          if (!_this2.percSumm) return 0; //if(!this.calculateInvolved) return 0;

          return 100 * value * _this2.scaleCoef / _this2.percSumm[_this2.startIndex + i]; //return ((value) * this.scaleCoef);
        });
      }
    }, {
      key: "setCalculatedX",
      value: function setCalculatedX(calculatedX, startIndex, endIndex) {
        this.calculatedX = calculatedX;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        var filteredColumn = this.column.slice(startIndex, endIndex + 1);
        this.maxValue = Math.max.apply(null, filteredColumn);
        this.minValue = Math.min.apply(null, filteredColumn);
        this.calculateColumn();
        this.needRedraw = true;
      }
    }, {
      key: "setVisibility",
      value: function setVisibility(state, isInstantly) {
        this.calculateInvolved = state;
        this.needRedraw = true;

        if (isInstantly) {
          this.fromColumn = this.toColumn = this.currentColumn = state ? this.column : this.emptyColumn;
          this.calculateColumn();
          return;
        }

        this.fromColumn = this.currentColumn;
        this.toColumn = state ? this.column : this.emptyColumn;
        this.isAnimating = true;
        this.animationTimer = 0;
      }
    }, {
      key: "getColumnValue",
      value: function getColumnValue(index) {
        var value = this.calculatedColumn[index];
        var id = parseInt(this.id);
        var height = this.height - this.minDotPos;

        while (id > 0) {
          id--;
          var line = this.lines['y' + id];
          value += line.calculatedColumn[index];
        } //if(this.percentsSumm)
        //  value /= (this.percentsSumm[this.startIndex + index] / 100);


        return height - value;
      }
    }, {
      key: "update",
      value: function update(delta) {
        var _this3 = this;

        if (!this.calculatedX) return;
        var isAnimating = false;

        if (this.isAnimating) {
          isAnimating = true;
          this.animationTimer += delta;

          if (this.animationTimer > 300) {
            this.isAnimating = false;
            this.currentColumn = this.toColumn;
          } else {
            //console.log((this.toColumn[364] - this.fromColumn[364]) * this.animationTimer / 300);
            //console.log('line', performance.now());
            this.currentColumn = this.fromColumn.map(function (value, i) {
              return value + (_this3.toColumn[i] - value) * _this3.animationTimer / 300;
            });
          }

          this.calculateColumn();
        } else if (this.isAnimatingOther) {
          isAnimating = true;
          this.calculateColumn();
        }

        this.needRedraw = this.prevIsAnimating || isAnimating;
        this.prevIsAnimating = isAnimating;
      }
    }, {
      key: "draw",
      value: function draw(context) {
        //this.calculateColumn();
        // Setup draw styles
        context.globalAlpha = this.currentOpacity; //context.globalCompositeOperation = 'destination-over';

        context.fillStyle = this.color.value; // Draw line

        context.beginPath();
        context.moveTo(this.calculatedX[0], this.height - this.minDotPos);

        for (var i = 0, l = this.calculatedColumn.length; i < l; i++) {
          //context.lineTo(this.calculatedX[i] | 0, calculatedColumn[i] | 0);
          context.lineTo(this.calculatedX[i], this.getColumnValue(i));
        }

        context.lineTo(this.calculatedX[this.calculatedColumn.length - 1], this.height - this.minDotPos);
        context.fill(); // Reset used by other elements types styles

        context.globalAlpha = 1;
        context.globalCompositeOperation = 'source-over';
      }
    }]);

    return CanvasPercent;
  }();

  var ChartPercentsCanvas =
  /*#__PURE__*/
  function () {
    function ChartPercentsCanvas(options) {
      var _this = this;

      _classCallCheck(this, ChartPercentsCanvas);

      this.type = options.type;
      this.isChild = options.isChild;
      this.overlayHeight = 10;
      this.width = 0;
      this.chartHeight = 0;
      this.lastInnerHeight = 0;
      this.viewportStart = options.viewportStart;
      this.viewportLong = options.viewportLong;
      this.colorLabelsAxisY = options.colorLabelsAxisY;
      this.colorLabelsAxisX = options.colorLabelsAxisX;
      var $dom = document.createElement('div');
      $dom.classList.add('chart');
      this.$dom = $dom;
      var globalEmmiter = options.globalEmmiter;
      this.globalEmmiter = options.globalEmmiter;
      var containerEmmiter = options.containerEmmiter;
      this.containerEmmiter = options.containerEmmiter;
      var renderer = new ChartPercentsRenderer({
        type: options.type,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(renderer.$dom);
      this.renderer = renderer;
      var chartTooltip = new ChartPercentsTooltip({
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(chartTooltip.$dom);
      this.chartTooltip = chartTooltip;
      var tooltip = new Tooltip({
        showArrow: !options.isChild,
        isPercents: true,
        onclick: options.tooltipClickHandler,
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(tooltip.$dom);
      this.tooltip = tooltip;
      this.handleInteractive(); //
      // Dates range values
      //

      this.prevIsShortDates = window.innerWidth <= 400;
      this.prevRangeText = '';
      this.prevDates = '';
      this.switcherChangeTimeout;
      globalEmmiter.on('resize', function () {
        if (_this.isHidden) return;

        _this.calculateSize();
      });
      containerEmmiter.on('line-toggle', function (id, state) {
        if (_this.isHidden || !_this.isDataSetted) return;

        _this.canvasLines[id].setVisibility(state);

        renderer.needRecalculateScaleCoef = true;
        renderer.isSetScaleInstantly = true;
        setTimeout(function () {
          tooltip.toggleElement(id, state);
        }, 175);
      });
      containerEmmiter.on('viewport-change', function (start, long) {
        if (_this.isHidden || !_this.isDataSetted) return;
        _this.viewportStart = start;
        _this.viewportLong = long;

        _this.calculateViewport();
      });
      containerEmmiter.on('viewport-change-update', function () {
        if (_this.isHidden || !_this.isDataSetted) return;

        _this.calculateRangeDates(true);
      });
    }

    _createClass(ChartPercentsCanvas, [{
      key: "setData",
      value: function setData(data) {
        var _this2 = this;

        this.isDataSetted = true;
        this.x = data.x;
        this.lines = data.lines;
        this.minX = this.x[0];
        this.maxX = this.x[this.x.length - 1];
        this.renderer.elements = [];
        var canvasLines = data.lines.reduce(function (result, line, i) {
          var canvasLine = new CanvasPercent({
            id: line.id.substr(1),
            zIndex: i + 10,
            minDotPos: 21,
            topOffset: _this2.overlayHeight,
            color: line.color,
            width: 2,
            column: line.column,
            useToggleScaleAnimation: true,
            containerEmmiter: _this2.containerEmmiter
          });

          if (data.linesVisibility && !data.linesVisibility[line.id]) {
            canvasLine.setVisibility(false, true);
          }

          _this2.renderer.add(canvasLine);

          result[line.id] = canvasLine;
          return result;
        }, {});
        this.canvasLines = canvasLines;

        for (var id in canvasLines) {
          canvasLines[id].setAll(canvasLines, data.lines.length);
        }

        var canvasAxisX = new CanvasAxisX({
          labelsColor: this.colorLabelsAxisX,
          containerEmmiter: this.containerEmmiter
        });
        this.renderer.add(canvasAxisX);
        this.canvasAxisX = canvasAxisX;
        var canvasAxisY = new CanvasAxisY({
          isLineTop: true,
          countValues: 5,
          overlayHeight: this.overlayHeight,
          minDotPos: 21,
          labelsColor: this.colorLabelsAxisY
        });
        this.renderer.add(canvasAxisY);
        this.canvasAxisX.setData(data.x);
        this.chartTooltip.setData({
          lines: data.lines,
          canvasLines: canvasLines
        });
        this.tooltip.setInitData(data.lines);
      }
    }, {
      key: "hide",
      value: function hide() {
        var _this3 = this;

        this.isHidden = true;
        this.renderer.stop();
        if (this.isChild) this.$dom.classList.add('chart__child-hide');else this.$dom.classList.add('chart__main-hide');
        setTimeout(function () {
          _this3.$dom.style.display = 'none';
        }, 325);
      }
    }, {
      key: "show",
      value: function show(linesVisibility) {
        var _this4 = this;

        this.isHidden = false;
        this.$dom.style.display = 'block';
        setTimeout(function () {
          if (_this4.isChild) _this4.$dom.classList.remove('chart__child-hide');else _this4.$dom.classList.remove('chart__main-hide');
        }, 0);

        if (linesVisibility) {
          Object.keys(this.canvasLines).forEach(function (id) {
            _this4.canvasLines[id].setVisibility(linesVisibility[id], true);

            _this4.tooltip.toggleElement(id, linesVisibility[id]);
          });
        }

        setTimeout(function () {
          _this4.calculateSize(true);

          _this4.renderer.start();
        }, 0);
      }
    }, {
      key: "calculateRangeDates",
      value: function calculateRangeDates(isInstantly) {
        var _this5 = this;

        var dates = this.x[this.startIndex] + '-' + this.x[this.endIndex];
        if (this.prevDates == dates && !isInstantly) return;

        if (isInstantly) {
          clearTimeout(this.switcherChangeTimeout);
          var rangeText = generateRangeText(this.x[this.startIndex], this.x[this.endIndex]);
          if (rangeText == this.prevRangeText) return;
          this.containerEmmiter.emit('viewport-range-text', rangeText, dates < this.prevDates);
          this.prevRangeText = rangeText;
          this.prevDates = dates;
          return;
        }

        var isShortDates = window.innerWidth <= 400;

        if (isShortDates != this.prevIsShortDates) {
          this.prevIsShortDates = isShortDates;

          var _rangeText = generateRangeText(this.x[this.startIndex], this.x[this.endIndex]);

          if (_rangeText == this.prevRangeText) return;
          this.containerEmmiter.emit('viewport-range-text', _rangeText, dates < this.prevDates, true);
          this.prevRangeText = _rangeText;
          this.prevDates = dates;
          return;
        }

        clearTimeout(this.switcherChangeTimeout);
        this.switcherChangeTimeout = setTimeout(function () {
          var rangeText = generateRangeText(_this5.x[_this5.startIndex], _this5.x[_this5.endIndex]);
          if (rangeText == _this5.prevRangeText) return;

          _this5.containerEmmiter.emit('viewport-range-text', rangeText, dates < _this5.prevDates);

          _this5.prevRangeText = rangeText;
          _this5.prevDates = dates;
        }, this.prevRangeText != '' ? 150 : 0);
      }
    }, {
      key: "calculateViewport",
      value: function calculateViewport(isFirst) {
        var width = this.width || 1;
        var fullWidth = width / this.viewportLong;
        var fixViewportStart = this.viewportStart - 18 / fullWidth;
        var fixViewportLong = this.viewportLong + 36 / fullWidth;
        var startIndex = Math.floor(fixViewportStart * this.x.length) - 1;
        var endIndex = Math.ceil((fixViewportStart + fixViewportLong) * this.x.length) + 2;
        if (startIndex < 0) startIndex = 0;
        if (endIndex > this.x.length - 1) endIndex = this.x.length - 1;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        var rangeX = this.maxX - this.minX;
        var minViewX = rangeX * fixViewportStart + this.minX;
        var fixCoef = width / (rangeX * fixViewportLong);
        this.calculatedX = this.x.slice(startIndex, endIndex + 1).map(function (value) {
          return (value - minViewX) * fixCoef;
        }); //
        // Calculate viewport range text for chart title
        //

        this.calculateRangeDates(); //
        // Set calculatedX to elements
        //

        for (var id in this.canvasLines) {
          this.canvasLines[id].setCalculatedX(this.calculatedX, startIndex, endIndex);
        }

        this.canvasAxisX.calculatedX = this.calculatedX;
        this.canvasAxisX.calculateViewport(isFirst, this.viewportStart, this.viewportLong, startIndex, endIndex);
        this.renderer.needRecalculateAsFirst = isFirst;
        this.renderer.needRecalculateScaleCoef = true;
        this.renderer.lastRecalculatedFiredStart = startIndex;
        this.renderer.lastRecalculatedFiredEnd = endIndex;
        this.renderer.needRedraw = true;
      }
    }, {
      key: "calculateSize",
      value: function calculateSize(isFirst) {
        var isWidthChanged = false;
        var isHeightChanged = false; //
        // Width part
        //

        var $dom = this.$dom;
        var width = $dom.offsetWidth;

        if (this.tooltip.isVisible) {
          this.tooltip.isVisible = false;
          this.tooltip.show(this.tooltip.lastPosition * width / this.width);
        }

        if (width != this.width || isFirst) {
          isWidthChanged = true;
          this.width = width;
          this.calculateViewport(isFirst);
        } //
        // Height part
        //


        var windowHeight = innerHeight;
        var chartHeight = this.chartHeight; // Handle only height changes > 10%

        if (Math.abs(windowHeight - this.lastInnerHeight) / this.lastInnerHeight > 0.2) {
          this.lastInnerHeight = windowHeight;
          var isMobile = detectMobile();

          if (isMobile) {
            chartHeight = windowHeight * 0.5;
          } else {
            chartHeight = windowHeight * 0.3;
          }

          chartHeight = Math.round(chartHeight);
          if (chartHeight < 300) chartHeight = 300;

          if (chartHeight != this.chartHeight || isFirst) {
            isHeightChanged = true;
            this.chartHeight = chartHeight;
            this.renderer.needRecalculateAsFirst = true;
            this.renderer.needRecalculateScaleCoef = true;
            this.renderer.needRedraw = true;
          }
        }

        if (!isWidthChanged && !isHeightChanged) return; //
        // Set calculated values
        //

        this.tooltip.setSize(width, chartHeight);
        this.chartTooltip.setSize(width, chartHeight);
        this.tooltipVisible = false;
        this.renderer.setSize(width, chartHeight);
        this.containerEmmiter.emit('chart-size-sets', chartHeight);
      }
    }, {
      key: "handleInteractive",
      value: function handleInteractive() {
        var _this6 = this;

        this.tooltipVisible = false;
        var prevIndex = null;
        var currentGlobalEvent = null;

        var showTooltip = function showTooltip(x) {
          var xPos = x;
          var offset = _this6.calculatedX[0];

          var calcX = _this6.calculatedX.map(function (pos) {
            return pos - offset;
          });

          var index = Math.round((xPos - offset) / ((calcX[calcX.length - 1] - calcX[0]) / (calcX.length - 1)));
          if (index < 0) index = 0;

          if (index > _this6.calculatedX.length - 1) {
            index = _this6.calculatedX.length - 1;
          }

          if (index === prevIndex && _this6.tooltipVisible) return; // Not get elements out of viewport

          if (_this6.calculatedX[index] <= 0 || _this6.calculatedX[index] >= _this6.width) {
            var dir = _this6.calculatedX[index] <= 0 ? 1 : -1;

            for (var i = index + dir; true; i += dir) {
              if (_this6.calculatedX[i] > 0 && _this6.calculatedX[i] < _this6.width) {
                index = i;
                break;
              }
            }
          }

          var values = {};

          _this6.lines.forEach(function (line) {
            values[line.id] = Math.round(line.column[_this6.startIndex + index]);
          });

          var range = _this6.x[_this6.endIndex] - _this6.x[_this6.startIndex];

          _this6.tooltip.setData({
            timestamp: _this6.x[_this6.startIndex + index],
            values: values,
            dir: index < prevIndex,
            isInstantly: !_this6.tooltipVisible,
            range: range
          });

          if (!_this6.tooltipVisible) {
            _this6.chartTooltip.show(_this6.calculatedX[index], index);

            _this6.tooltip.show(_this6.calculatedX[index]);
          } else {
            _this6.chartTooltip.setPos(_this6.calculatedX[index], index);

            _this6.tooltip.setPos(_this6.calculatedX[index]);
          }

          prevIndex = index;
          currentGlobalEvent = _this6.startIndex + index;
          _this6.tooltipVisible = true;
        };

        var hideTooltip = function hideTooltip() {
          if (!_this6.tooltipVisible) return;

          _this6.tooltip.hide();

          _this6.chartTooltip.hide();

          _this6.tooltipVisible = false;
        };

        var startTouchX = 0;
        var startTouchY = 0;
        var touchShowTimeout = 0;
        var started = false;
        var disabled = false;
        var pressed = false;
        this.$dom.addEventListener('mousedown', function (e) {
          if (_this6.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          pressed = true;
          showTooltip(e.pageX - rect.left);
        });
        this.$dom.addEventListener('mousemove', function (e) {
          if (!pressed) return; //if(this.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          showTooltip(e.pageX - rect.left);
        });
        document.body.addEventListener('mouseleave', function (e) {
          if (pressed && !_this6.isChild) _this6.containerEmmiter.emit('tooltip-stopped', currentGlobalEvent);
          pressed = false;
        });
        document.body.addEventListener('mouseup', function (e) {
          if (pressed && !_this6.isChild) _this6.containerEmmiter.emit('tooltip-stopped', currentGlobalEvent);
          pressed = false;
        });
        this.$dom.addEventListener('touchstart', function (e) {
          if (_this6.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          startTouchX = e.touches[0].pageX - rect.left;
          startTouchY = e.touches[0].pageY - rect.top;
          started = false;
          disabled = false;
          touchShowTimeout = setTimeout(function () {
            started = true;
            showTooltip(startTouchX);
          }, 300);
        });
        this.$dom.addEventListener('touchmove', function (e) {
          if (disabled) return; //if(this.tooltip.$dom.contains(e.target)) return;

          var rect = _this6.$dom.getBoundingClientRect();

          var touchX = e.touches[0].pageX - rect.left;

          if (!started) {
            var touchY = e.touches[0].pageY - rect.top;
            var lengthX = Math.abs(touchX - startTouchX);
            var lengthY = Math.abs(touchY - startTouchY);

            if (lengthY > lengthX) {
              clearTimeout(touchShowTimeout);
              disabled = true;
              hideTooltip();
              return;
            }

            started = true;
          }

          e.preventDefault();
          showTooltip(touchX);
        });
        this.$dom.addEventListener('touchend', function () {
          if (!started && !_this6.isChild) return;

          _this6.containerEmmiter.emit('tooltip-stopped', currentGlobalEvent);
        });
        document.body.addEventListener('touchstart', function (e) {
          if (!_this6.$dom.contains(e.target)) hideTooltip();
        });
        document.body.addEventListener('mousedown', function (e) {
          if (!_this6.$dom.contains(e.target)) {
            hideTooltip();
            pressed = false;
          }
        });
      }
    }]);

    return ChartPercentsCanvas;
  }();

  var ChartCircleTooltip =
  /*#__PURE__*/
  function () {
    function ChartCircleTooltip(options) {
      var _this = this;

      _classCallCheck(this, ChartCircleTooltip);

      this.globalEmmiter = options.globalEmmiter;
      this.countAll = options.countAll;
      var $dom = document.createElement('div');
      $dom.className = 'tooltip tooltip__circle';
      this.$dom = $dom;
      var $tooltipElements = document.createElement('div');
      $tooltipElements.classList.add('tooltip_elements');
      this.$tooltipElements = $tooltipElements;
      this.$dom.appendChild($tooltipElements);
      var $element = document.createElement('div');
      $element.classList.add('tooltip_element');
      $tooltipElements.appendChild($element);
      var $tooltipName = document.createElement('div');
      $tooltipName.classList.add('tooltip_name');
      $tooltipName.textContent = options.name;
      $element.appendChild($tooltipName);
      var nameSwitcher = new TextSwitcher({
        isLeft: true
      });
      $tooltipName.appendChild(nameSwitcher.$dom);
      this.nameSwitcher = nameSwitcher;
      var $tooltipValue = document.createElement('div');
      $tooltipValue.classList.add('tooltip_value');
      $element.appendChild($tooltipValue);
      this.$tooltipValue = $tooltipValue;
      var valueSwitcher = new TextSwitcher({
        isRight: true
      });
      $tooltipValue.appendChild(valueSwitcher.$dom);
      this.valueSwitcher = valueSwitcher;
      this.hideTimeout = null;
      this.prevLabel = '';
      this.prevValue = '';
      this.isDark = false;
      options.globalEmmiter.on('theme-change', function (isDark) {
        $tooltipValue.style.color = isDark ? _this.darkColor : _this.lightColor;
        _this.isDark = isDark;
      });
    }

    _createClass(ChartCircleTooltip, [{
      key: "setPos",
      value: function setPos(label, colorValue, value, x, y, isFirst) {
        value = value.toString();
        var left = x - this.$dom.offsetWidth / 2;
        var top = y - this.$dom.offsetHeight - 80;
        if (left < 5) left = 5;
        var maxLeft = this.width - 5 - this.$dom.offsetWidth;
        if (left > maxLeft) left = maxLeft;
        if (top < 0) top = 0;
        this.$dom.style.transform = 'translate(' + left + 'px, ' + top + 'px)';

        if (this.prevLabel !== label) {
          if (isFirst) this.nameSwitcher.set(label);else this.nameSwitcher.change(label);
        }

        this.prevLabel = label;

        if (this.prevValue !== value) {
          if (isFirst) this.valueSwitcher.set(value);else this.valueSwitcher.change(value);
          var color = Colors.get(colorValue + ':tooltip');
          this.lightColor = 'rgb(' + color.light.join(',') + ')';
          this.darkColor = 'rgb(' + color.dark.join(',') + ')';
          this.$tooltipValue.style.color = this.isDark ? this.darkColor : this.lightColor;
        }

        this.prevValue = value;
      }
    }, {
      key: "show",
      value: function show(label, color, value, x, y) {
        var _this2 = this;

        clearTimeout(this.hideTimeout);
        this.$dom.style.display = 'block';
        setTimeout(function () {
          _this2.$dom.style.opacity = '1';
          _this2.$dom.style.transition = 'opacity 0.15s linear';

          _this2.setPos(label, color, value, x, y, true);

          setTimeout(function () {
            _this2.$dom.style.transition = null;
          }, 50);
        }, 0);
      }
    }, {
      key: "hide",
      value: function hide() {
        var _this3 = this;

        this.$dom.style.opacity = '0';
        this.hideTimeout = setTimeout(function () {
          _this3.$dom.style.display = 'none';
        }, 175);
      }
    }, {
      key: "setSize",
      value: function setSize(width) {
        this.width = width;
        this.hide();
      }
    }]);

    return ChartCircleTooltip;
  }();

  var ChartCircleRenderer =
  /*#__PURE__*/
  function (_Renderer) {
    _inherits(ChartCircleRenderer, _Renderer);

    function ChartCircleRenderer(options) {
      var _this;

      _classCallCheck(this, ChartCircleRenderer);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(ChartCircleRenderer).call(this, options));
      _this.type = options.type;
      _this.needRecalculateScaleCoef = true;
      _this.needRecalculateAsFirst = false;
      _this.prevMaxDotValue = null;
      _this.prevMinDotValue = null;
      _this.isSetScaleInstantly = false;
      _this.lastUpdateFired = 0;
      _this.lastRecalculatedFiredStart = 0;
      _this.lastRecalculatedFiredEnd = 0;
      _this.lastUpdateFiredStart = 0;
      _this.lastUpdateFiredEnd = 0;
      _this.containerEmmiter = options.containerEmmiter;
      return _this;
    }

    _createClass(ChartCircleRenderer, [{
      key: "start",
      value: function start() {
        this.calculateScaleCoef(true);

        _get(_getPrototypeOf(ChartCircleRenderer.prototype), "start", this).call(this);
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        _get(_getPrototypeOf(ChartCircleRenderer.prototype), "setSize", this).call(this, width, height);

        this.isSetScaleInstantly = true;
      }
    }, {
      key: "render",
      value: function render(delta) {
        if (this.needRecalculateScaleCoef) {
          this.calculateScaleCoef(this.needRecalculateAsFirst);
          this.needRecalculateAsFirst = false;
          this.needRecalculateScaleCoef = false;
          this.needRedraw = true;
        }

        this.elements.forEach(function (element) {
          if (element.update) element.update(delta);
        });

        _get(_getPrototypeOf(ChartCircleRenderer.prototype), "render", this).call(this, delta);
      }
    }, {
      key: "calculateScaleCoef",
      value: function calculateScaleCoef(isFirst) {
        /*this.elements.forEach(element => {
          if(element.type == 'line') {
            element.calculateScaleCoef(106, isFirst);
          }
        });*/
        var lastUpdatedChangeRange = 0.25 * (this.lastUpdateFiredEnd - this.lastUpdateFiredStart);

        if (Math.abs(this.lastUpdateFiredStart - this.lastRecalculatedFiredStart) > lastUpdatedChangeRange || Math.abs(this.lastUpdateFiredEnd - this.lastRecalculatedFiredEnd) > lastUpdatedChangeRange) {
          this.containerEmmiter.emit('viewport-change-update');
          this.lastUpdateFiredStart = this.lastRecalculatedFiredStart;
          this.lastUpdateFiredEnd = this.lastRecalculatedFiredEnd;
        }
      }
    }]);

    return ChartCircleRenderer;
  }(Renderer);

  var CanvasArc =
  /*#__PURE__*/
  function () {
    function CanvasArc(options) {
      _classCallCheck(this, CanvasArc);

      this.type = 'line';
      this.zIndex = options.zIndex;
      this.needRedraw = false;
      this.id = options.id;
      this.height = options.height || 0;
      this.color = Colors.get(options.color + ':line');
      this.textStroke = Colors.get('BACKGROUND');
      this.width = options.width || 0;
      this.currentOffset = 0;
    }

    _createClass(CanvasArc, [{
      key: "setPerc",
      value: function setPerc(perc, prevPerc) {
        this.needRedraw = true;

        if (this.currentPerc === undefined) {
          this.fromPerc = this.currentPerc = this.toPerc = perc;
          this.fromPrevPerc = this.currentPrevPerc = this.toPrevPerc = prevPerc;
          return;
        }

        this.fromPerc = this.currentPerc;
        this.toPerc = perc;
        this.fromPrevPerc = this.currentPrevPerc;
        this.toPrevPerc = prevPerc;
        this.isAnimating = true;
        this.animationTimer = 0;
      }
    }, {
      key: "setOffset",
      value: function setOffset(isOffset) {
        this.fromOffset = this.currentOffset;
        this.toOffset = isOffset ? this.chartRadius * 0.15 : 0;
        this.isOffsetAnimating = true;
        this.animationOffsetTimer = 0;
        this.needRedraw = true;
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        this.height = height;
        this.width = width;
        var minValue = Math.min(width, height);
        this.chartRadius = minValue * 0.4;
      }
    }, {
      key: "setVisibility",
      value: function setVisibility() {}
    }, {
      key: "draw",
      value: function draw(context, delta) {
        var isAnimating = false;

        if (this.isAnimating) {
          isAnimating = true;
          this.animationTimer += delta;

          if (this.animationTimer > 300) {
            this.isAnimating = false;
            this.currentPerc = this.toPerc;
            this.currentPrevPerc = this.toPrevPerc;
          } else {
            this.currentPerc = this.fromPerc + (this.toPerc - this.fromPerc) * this.animationTimer / 300;
            this.currentPrevPerc = this.fromPrevPerc + (this.toPrevPerc - this.fromPrevPerc) * this.animationTimer / 300;
          }
        }

        if (this.isOffsetAnimating) {
          isAnimating = true;
          this.animationOffsetTimer += delta;

          if (this.animationOffsetTimer > 300) {
            this.isOffsetAnimating = false;
            this.currentOffset = this.toOffset;
          } else {
            this.currentOffset = this.fromOffset + (this.toOffset - this.fromOffset) * this.animationOffsetTimer / 300;
          }
        }

        this.needRedraw = this.prevIsAnimating || isAnimating;
        this.prevIsAnimating = isAnimating;
        context.fillStyle = this.color.value;
        var centerX = this.width / 2;
        var centerY = this.height / 2 + 10;
        var fullAngle = 2 * Math.PI;
        var offsetAngle = Math.PI / 2;
        var startAngle = fullAngle * this.currentPrevPerc / 100;
        var endAngle = fullAngle * (this.currentPrevPerc + this.currentPerc) / 100;

        if (this.currentOffset != 0) {
          var angle = startAngle + (endAngle - startAngle) / 2;
          var offsetX = this.currentOffset * Math.cos(angle - offsetAngle);
          var offsetY = this.currentOffset * Math.sin(angle - offsetAngle);
          centerX += offsetX;
          centerY += offsetY;
        }

        context.beginPath();
        context.moveTo(centerX, centerY);
        context.arc(centerX, centerY, this.chartRadius, startAngle - offsetAngle, endAngle - offsetAngle);
        context.lineTo(centerX, centerY);
        context.fill(); // Draw label

        if (this.currentPerc >= 5) {
          var calculatedAngle = endAngle - offsetAngle - (endAngle - startAngle) / 2;
          var fontSize = this.chartRadius * 0.5 * this.currentPerc / 100;

          if (fontSize > 36) {
            fontSize = 36;
          }

          if (fontSize < 12) {
            fontSize = 12;
          }

          var labelX = centerX + this.chartRadius * 0.6 * Math.cos(calculatedAngle);
          var labelY = centerY + this.chartRadius * 0.6 * Math.sin(calculatedAngle);
          context.fillStyle = this.color.value;
          context.strokeStyle = this.textStroke.value;
          context.font = fontSize + 'px HelveticaNeue';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.lineWidth = 3.5;
          context.lineJoin = 'round';
          context.strokeText(Math.round(this.currentPerc) + '%', labelX, labelY);
          context.fillText(Math.round(this.currentPerc) + '%', labelX, labelY);
          context.lineWidth = 1;
          context.lineJoin = 'meter';
        }
      }
    }]);

    return CanvasArc;
  }();

  var ChartCircleCanvas =
  /*#__PURE__*/
  function () {
    function ChartCircleCanvas(options) {
      var _this = this;

      _classCallCheck(this, ChartCircleCanvas);

      this.type = options.type;
      this.isChild = options.isChild;
      this.overlayHeight = 10;
      this.width = 0;
      this.chartHeight = 0;
      this.lastInnerHeight = 0;
      this.viewportStart = options.viewportStart;
      this.viewportLong = options.viewportLong;
      this.colorLabelsAxisY = options.colorLabelsAxisY;
      this.colorLabelsAxisX = options.colorLabelsAxisX;
      var $dom = document.createElement('div');
      $dom.classList.add('chart');
      $dom.style.cursor = 'auto';
      this.$dom = $dom;
      var globalEmmiter = options.globalEmmiter;
      this.globalEmmiter = options.globalEmmiter;
      var containerEmmiter = options.containerEmmiter;
      this.containerEmmiter = options.containerEmmiter;
      var renderer = new ChartCircleRenderer({
        type: options.type,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(renderer.$dom);
      this.renderer = renderer;
      var chartTooltip = new ChartCircleTooltip({
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(chartTooltip.$dom);
      this.chartTooltip = chartTooltip;
      this.handleInteractive(); //
      // Dates range values
      //

      this.prevIsShortDates = window.innerWidth <= 400;
      this.prevRangeText = '';
      this.prevDates = '';
      this.switcherChangeTimeout;
      globalEmmiter.on('resize', function () {
        if (_this.isHidden) return;

        _this.calculateSize();
      });
      containerEmmiter.on('line-toggle', function (id, state) {
        if (_this.isHidden || !_this.isDataSetted) return;

        _this.canvasLines[id].setVisibility(state);

        renderer.needRecalculateScaleCoef = true;
        renderer.isSetScaleInstantly = true;

        _this.calculateViewport();
      });
      containerEmmiter.on('viewport-change', function (start, long) {
        if (_this.isHidden || !_this.isDataSetted) return;
        _this.viewportStart = start;
        _this.viewportLong = long;

        _this.calculateViewport();
      });
      containerEmmiter.on('viewport-change-update', function () {
        if (_this.isHidden || !_this.isDataSetted) return;

        _this.calculateRangeDates(true);
      });
    }

    _createClass(ChartCircleCanvas, [{
      key: "setData",
      value: function setData(data) {
        var _this2 = this;

        this.isDataSetted = true;
        this.x = data.x;
        this.lines = data.lines;
        this.minX = this.x[0];
        this.maxX = this.x[this.x.length - 1];
        this.renderer.elements = [];
        var canvasLines = data.lines.reduce(function (result, line, i) {
          var canvasLine = new CanvasArc({
            id: line.id.substr(1),
            zIndex: i + 10,
            minDotPos: 21,
            topOffset: _this2.overlayHeight,
            color: line.color,
            width: 2,
            column: line.column,
            useToggleScaleAnimation: true,
            containerEmmiter: _this2.containerEmmiter
          });

          _this2.renderer.add(canvasLine);

          result[line.id] = canvasLine;
          return result;
        }, {});
        this.canvasLines = canvasLines;
      }
    }, {
      key: "hide",
      value: function hide() {
        var _this3 = this;

        this.isHidden = true;
        this.renderer.stop();
        if (this.isChild) this.$dom.classList.add('chart__child-hide');else this.$dom.classList.add('chart__main-hide');
        setTimeout(function () {
          _this3.$dom.style.display = 'none';
        }, 325);
      }
    }, {
      key: "show",
      value: function show(linesVisibility) {
        var _this4 = this;

        this.isHidden = false;
        this.$dom.style.display = 'block';
        setTimeout(function () {
          if (_this4.isChild) _this4.$dom.classList.remove('chart__child-hide');else _this4.$dom.classList.remove('chart__main-hide');
        }, 0);

        if (linesVisibility) {
          Object.keys(this.canvasLines).forEach(function (id) {
            _this4.canvasLines[id].setVisibility(linesVisibility[id], true);
          });
        }

        this.linesVisibility = linesVisibility;
        setTimeout(function () {
          _this4.calculateSize(true);

          _this4.renderer.start();
        }, 0);
      }
    }, {
      key: "calculateRangeDates",
      value: function calculateRangeDates(isInstantly) {
        var _this5 = this;

        var dates = this.x[this.startIndex] + '-' + this.x[this.endIndex];
        if (this.prevDates == dates && !isInstantly) return;

        if (isInstantly) {
          clearTimeout(this.switcherChangeTimeout);
          var rangeText = generateRangeText(this.x[this.startIndex], this.x[this.endIndex]);
          if (rangeText == this.prevRangeText) return;
          this.containerEmmiter.emit('viewport-range-text', rangeText, dates < this.prevDates);
          this.prevRangeText = rangeText;
          this.prevDates = dates;
          return;
        }

        var isShortDates = window.innerWidth <= 400;

        if (isShortDates != this.prevIsShortDates) {
          this.prevIsShortDates = isShortDates;

          var _rangeText = generateRangeText(this.x[this.startIndex], this.x[this.endIndex]);

          if (_rangeText == this.prevRangeText) return;
          this.containerEmmiter.emit('viewport-range-text', _rangeText, dates < this.prevDates, true);
          this.prevRangeText = _rangeText;
          this.prevDates = dates;
          return;
        }

        clearTimeout(this.switcherChangeTimeout);
        this.switcherChangeTimeout = setTimeout(function () {
          var rangeText = generateRangeText(_this5.x[_this5.startIndex], _this5.x[_this5.endIndex]);
          if (rangeText == _this5.prevRangeText) return;

          _this5.containerEmmiter.emit('viewport-range-text', rangeText, dates < _this5.prevDates);

          _this5.prevRangeText = rangeText;
          _this5.prevDates = dates;
        }, this.prevRangeText != '' ? 150 : 0);
      }
    }, {
      key: "calculateViewport",
      value: function calculateViewport(isFirst) {
        var _this6 = this;

        var width = this.width || 1;
        var fullWidth = width / this.viewportLong;
        var fixViewportStart = this.viewportStart - 18 / fullWidth;
        var fixViewportLong = this.viewportLong + 36 / fullWidth;
        var startIndex = Math.floor(fixViewportStart * this.x.length) - 1;
        var endIndex = Math.ceil((fixViewportStart + fixViewportLong) * this.x.length) + 2;
        if (startIndex < 0) startIndex = 0;
        if (endIndex > this.x.length - 1) endIndex = this.x.length - 1;
        this.startIndex = startIndex;
        this.endIndex = endIndex; //
        // Calculate viewport range text for chart title
        //

        this.calculateRangeDates(); //
        // Calculate percents
        //

        var viewportSumms = {};
        var allSumm = 0;
        this.lines.forEach(function (line) {
          if (!_this6.linesVisibility[line.id]) return;
          var summ = line.column.slice(startIndex, endIndex + 1).reduce(function (result, value) {
            return result + value;
          });
          viewportSumms[line.id] = summ;
          allSumm += summ;
        });
        var prevPerc = 0;
        var roundingAddit = 0;
        var percents = {};
        Object.keys(this.canvasLines).forEach(function (key) {
          if (!viewportSumms[key]) {
            _this6.canvasLines[key].setPerc(0, prevPerc);

            percents[key] = {
              perc: 0,
              prevPerc: prevPerc
            };
            return;
          }

          var percent = 100 * viewportSumms[key] / allSumm - roundingAddit;
          var roundingPercent = Math.round(percent);
          roundingAddit = roundingPercent - percent;

          _this6.canvasLines[key].setPerc(roundingPercent, prevPerc);

          percents[key] = {
            perc: roundingPercent,
            prevPerc: prevPerc
          };
          prevPerc += roundingPercent;
        });
        this.percents = percents; //
        // Set calculatedX to elements
        //

        /*for(let id in this.canvasLines) {
          this.canvasLines[id].setCalculatedX(
            this.calculatedX, startIndex, endIndex
          );
        }*/

        this.renderer.needRecalculateAsFirst = isFirst;
        this.renderer.needRecalculateScaleCoef = true;
        this.renderer.lastRecalculatedFiredStart = startIndex;
        this.renderer.lastRecalculatedFiredEnd = endIndex;
        this.renderer.needRedraw = true;
      }
    }, {
      key: "calculateSize",
      value: function calculateSize(isFirst) {
        var isWidthChanged = false;
        var isHeightChanged = false; //
        // Width part
        //

        var $dom = this.$dom;
        var width = $dom.offsetWidth;

        if (width != this.width || isFirst) {
          isWidthChanged = true;
          this.width = width;
          this.calculateViewport(isFirst);
        } //
        // Height part
        //


        var windowHeight = innerHeight;
        var chartHeight = this.chartHeight; // Handle only height changes > 10%

        if (Math.abs(windowHeight - this.lastInnerHeight) / this.lastInnerHeight > 0.2) {
          this.lastInnerHeight = windowHeight;
          var isMobile = detectMobile();

          if (isMobile) {
            chartHeight = windowHeight * 0.5;
          } else {
            chartHeight = windowHeight * 0.3;
          }

          chartHeight = Math.round(chartHeight);
          if (chartHeight < 300) chartHeight = 300;

          if (chartHeight != this.chartHeight || isFirst) {
            isHeightChanged = true;
            this.chartHeight = chartHeight;
            this.renderer.needRecalculateAsFirst = true;
            this.renderer.needRecalculateScaleCoef = true;
            this.renderer.needRedraw = true;
          }
        }

        if (!isWidthChanged && !isHeightChanged) return; //
        // Set calculated values
        //

        this.chartTooltip.setSize(width, chartHeight);
        this.tooltipVisible = false;
        this.renderer.setSize(width, chartHeight);
        this.containerEmmiter.emit('chart-size-sets', chartHeight);
      }
    }, {
      key: "handleInteractive",
      value: function handleInteractive() {
        var _this7 = this;

        this.tooltipVisible = false;
        var prevSelectedKey = null;

        var showTooltip = function showTooltip(x, y) {
          var theta = Math.atan2(y - _this7.$dom.offsetHeight / 2, x - _this7.$dom.offsetWidth / 2) * 180 / Math.PI + 90;
          var angle = theta >= 0 ? theta : theta + 360;
          var percent = 100 * angle / 360;
          var selectedKey = null;
          Object.keys(_this7.percents).forEach(function (key) {
            if (percent > _this7.percents[key].prevPerc) selectedKey = key;
          });

          var line = _this7.lines.find(function (line) {
            return line.id == selectedKey;
          });

          if (!line) return;

          if (prevSelectedKey && prevSelectedKey != selectedKey) {
            _this7.canvasLines[prevSelectedKey].setOffset(false);
          }

          prevSelectedKey = selectedKey;

          _this7.canvasLines[selectedKey].setOffset(true);

          if (!_this7.tooltipVisible) {
            _this7.chartTooltip.show(line.name, line.color, _this7.percents[selectedKey].perc, x, y);
          } else {
            _this7.chartTooltip.setPos(line.name, line.color, _this7.percents[selectedKey].perc, x, y);
          }

          _this7.tooltipVisible = true;
        };

        var hideTooltip = function hideTooltip() {
          if (!_this7.tooltipVisible) return;
          Object.values(_this7.canvasLines).forEach(function (line) {
            line.setOffset(false);
          });

          _this7.chartTooltip.hide();

          _this7.tooltipVisible = false;
        };

        var handleMove = function handleMove(e) {
          var rect = _this7.$dom.getBoundingClientRect();

          var x;
          var y;

          if (e.touches) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
          } else {
            x = e.clientX;
            y = e.clientY;
          }

          x -= rect.left;
          y -= rect.top;
          var centerX = _this7.$dom.offsetWidth / 2;
          var centerY = _this7.$dom.offsetHeight / 2;
          var minValue = Math.min(_this7.$dom.offsetWidth, _this7.$dom.offsetHeight);
          var radius = minValue * 0.4;
          var length = Math.sqrt(Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2));

          if (length > radius) {
            hideTooltip();
            return;
          }

          e.preventDefault();
          showTooltip(x, y);
        };

        this.$dom.addEventListener('mousemove', handleMove);
        this.$dom.addEventListener('touchstart', handleMove);
        this.$dom.addEventListener('touchmove', handleMove);
        document.body.addEventListener('touchstart', function (e) {
          if (!_this7.$dom.contains(e.target)) hideTooltip();
        });
        document.body.addEventListener('mousedown', function (e) {
          if (!_this7.$dom.contains(e.target)) {
            hideTooltip();
          }
        });
      }
    }]);

    return ChartCircleCanvas;
  }();

  var ChartPercentsMap =
  /*#__PURE__*/
  function (_Renderer) {
    _inherits(ChartPercentsMap, _Renderer);

    function ChartPercentsMap(options) {
      var _this;

      _classCallCheck(this, ChartPercentsMap);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(ChartPercentsMap).call(this, options));
      _this.type = options.type;
      _this.height = options.height;
      options.containerEmmiter.on('line-toggle', function (id, state) {
        if (!_this.isRunning) return;

        _this.canvasLines[id].setVisibility(state);
      });
      _this.containerEmmiter = options.containerEmmiter;
      return _this;
    }

    _createClass(ChartPercentsMap, [{
      key: "setData",
      value: function setData(data) {
        var _this2 = this;

        this.x = data.x;
        this.minX = this.x[0];
        this.maxX = this.x[this.x.length - 1];
        this.elements = [];
        var canvasLines = data.lines.reduce(function (result, line, i) {
          var canvasLine = new CanvasPercent({
            id: line.id.substr(1),
            zIndex: i + 10,
            height: _this2.height,
            maxDotPos: _this2.height,
            topOffset: 0,
            color: line.color,
            width: 1,
            column: line.column,
            useToggleScaleAnimation: false,
            containerEmmiter: _this2.containerEmmiter
          });

          _this2.add(canvasLine);

          result[line.id] = canvasLine;
          return result;
        }, {});
        this.canvasLines = canvasLines;

        for (var id in canvasLines) {
          canvasLines[id].setAll(canvasLines);
        }
      }
    }, {
      key: "start",
      value: function start(linesVisibility) {
        var _this3 = this;

        this.calculateScaleCoef(true);

        if (linesVisibility) {
          Object.keys(this.canvasLines).forEach(function (id) {
            _this3.canvasLines[id].setVisibility(linesVisibility[id], true);
          });
          this.calculateScaleCoef(true);
        }

        _get(_getPrototypeOf(ChartPercentsMap.prototype), "start", this).call(this);
      }
    }, {
      key: "setSize",
      value: function setSize(width, height) {
        var _this4 = this;

        _get(_getPrototypeOf(ChartPercentsMap.prototype), "setSize", this).call(this, width, height);

        if (!this.x) return;
        var xCoef = width / (this.maxX - this.minX);
        var calculatedX = this.x.map(function (value) {
          return (value - _this4.minX) * xCoef;
        });

        for (var id in this.canvasLines) {
          this.canvasLines[id].setCalculatedX(calculatedX, 0, calculatedX.length - 1);
        }
      }
    }, {
      key: "calculateScaleCoef",
      value: function calculateScaleCoef(isFirst) {
        for (var id in this.canvasLines) {
          this.canvasLines[id].calculateScaleCoef(100, isFirst);
        }

        this.needRedraw = true;
      }
    }, {
      key: "render",
      value: function render(delta) {
        this.elements.forEach(function (element) {
          if (element.update) element.update(delta);
        });

        _get(_getPrototypeOf(ChartPercentsMap.prototype), "render", this).call(this, delta);
      }
    }]);

    return ChartPercentsMap;
  }(Renderer);

  var ChartPercents =
  /*#__PURE__*/
  function () {
    function ChartPercents(options) {
      var _this = this;

      _classCallCheck(this, ChartPercents);

      var sourceData = options.data;
      var data = handleInputData(sourceData);
      this.data = data;
      var globalEmmiter = options.globalEmmiter;
      var containerEmmiter = new Emmiter();
      this.containerEmmiter = containerEmmiter; //
      //
      // Animation
      //
      //

      var currentPercSumm = [];

      var _loop = function _loop(i, l) {
        var columnSumm = 0;
        data.lines.forEach(function (line) {
          columnSumm += line.column[i];
        });
        currentPercSumm.push(columnSumm);
      };

      for (var i = 0, l = data.lines[0].column.length; i < l; i++) {
        _loop(i, l);
      }

      var fromPercSumm = currentPercSumm;
      var toPercSumm = currentPercSumm;
      var isPercSummAnimated = false;
      var percSummAnimatedTime = 0;
      containerEmmiter.on('line-toggle', function (id, state) {
        linesVisibility[id] = state;
        fromPercSumm = currentPercSumm;
        var toggledColumn = data.lines.find(function (line) {
          return line.id == id;
        });
        toPercSumm = toPercSumm.map(function (value, i) {
          return value + toggledColumn.column[i] * (state ? 1 : -1);
        });
        isPercSummAnimated = true;
        percSummAnimatedTime = 0;
      });
      globalEmmiter.on('render', function (delta) {
        if (!isPercSummAnimated) return;
        percSummAnimatedTime += delta;

        if (percSummAnimatedTime > 300) {
          isPercSummAnimated = false;
          currentPercSumm = toPercSumm;
        } else {
          //console.log('summ', performance.now());
          currentPercSumm = fromPercSumm.map(function (value, i) {
            return value + (toPercSumm[i] - value) * percSummAnimatedTime / 300;
          });
        }

        containerEmmiter.emit('perc-summ-change', currentPercSumm, isPercSummAnimated);
      });
      var $dom = document.createElement('div');
      $dom.classList.add('container');
      this.$dom = $dom;
      var title = new Title({
        text: sourceData._title,
        containerEmmiter: containerEmmiter
      });
      $dom.appendChild(title.$dom);
      var $charts = document.createElement('div');
      $charts.className = 'container_charts';
      $dom.appendChild($charts);
      this.$charts = $charts;
      var $maps = document.createElement('div');
      $maps.className = 'container_maps';
      $dom.appendChild($maps);
      this.$maps = $maps; //
      // Main canvas
      //

      var mainCanvas = new ChartPercentsCanvas({
        type: options.type,
        tooltipClickHandler: this.tooltipClickHandler.bind(this),
        colorLabelsAxisY: options.colorLabelsAxisY,
        colorLabelsAxisX: options.colorLabelsAxisX,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $charts.appendChild(mainCanvas.$dom);
      mainCanvas.setData(data);
      mainCanvas.show();
      this.mainCanvas = mainCanvas; //
      // Child canvas
      //

      var childCanvas = new ChartCircleCanvas({
        type: options.type,
        isChild: true,
        isHidden: true,
        data: data,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      childCanvas.hide();
      $charts.appendChild(childCanvas.$dom);
      this.childCanvas = childCanvas; //
      // Main map
      //

      var mainChartLinesMap = new ChartPercentsMap({
        type: options.type,
        height: 44,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      mainChartLinesMap.setData(data);
      this.chartLinesMap = mainChartLinesMap;
      var mainMap = new Map({
        height: 44,
        renderer: mainChartLinesMap,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $maps.appendChild(mainMap.$dom);
      this.mainMap = mainMap;
      var legend = new Legend({
        data: data,
        containerEmmiter: containerEmmiter,
        globalEmmiter: globalEmmiter
      });
      $dom.appendChild(legend.$dom);
      this.type = options.type;
      this.dataLoader = options.dataLoader;
      containerEmmiter.emit('perc-summ-change', currentPercSumm);
      var linesVisibility = data.lines.reduce(function (result, line) {
        result[line.id] = true;
        return result;
      }, {});
      this.linesVisibility = linesVisibility;
      this.chartType = 'main';
      containerEmmiter.on('main-chart', function () {
        _this.chartType = 'main';

        _this.childCanvas.hide();

        _this.childCanvas.prevDates = '';
        _this.childCanvas.prevRangeText = '';

        _this.mainCanvas.show(_this.linesVisibility);

        var childViewboxStart = _this.mainMap.viewbox.start;
        var childViewboxLong = _this.mainMap.viewbox.long;

        _this.containerEmmiter.emit('viewport-change', childViewboxStart, childViewboxLong);

        _this.containerEmmiter.emit('switch-title', false);
      });
      containerEmmiter.on('chart-size-sets', function (height) {
        _this.$charts.style.height = height + 18 + 'px';
      });
    }

    _createClass(ChartPercents, [{
      key: "tooltipClickHandler",
      value: function tooltipClickHandler(tooltip) {
        this.mainCanvas.$dom.style.transformOrigin = tooltip.position + 'px center';
        this.childCanvas.$dom.style.transformOrigin = tooltip.position + 'px center';
        this.chartType = 'child';
        this.lastMainViewport = {
          start: this.mainMap.viewbox.start,
          long: this.mainMap.viewbox.long
        };
        this.mainCanvas.tooltip.$dom.style.display = 'none';
        this.mainCanvas.chartTooltip.$dom.style.display = 'none';
        this.mainCanvas.hide();
        var data = this.data;
        this.childCanvas.setData(data);
        this.childCanvas.show(this.linesVisibility);
        this.childCanvas.prevRangeText = this.mainCanvas.prevRangeText;
        this.childCanvas.prevDates = this.mainCanvas.prevDates;
        this.containerEmmiter.emit('viewport-change', this.mainMap.viewbox.start, this.mainMap.viewbox.long);
        this.containerEmmiter.emit('switch-title', true);
      }
    }]);

    return ChartPercents;
  }();

  var Charts =
  /*#__PURE__*/
  function () {
    function Charts(selector) {
      var _this = this;

      _classCallCheck(this, Charts);

      var globalEmmiter = new Emmiter();
      var dataLoader = new Data(globalEmmiter);
      dataLoader.getOverview(function (overviews) {
        _this.init(selector, globalEmmiter, overviews);
      });
      this.dataLoader = dataLoader;
    }

    _createClass(Charts, [{
      key: "init",
      value: function init(selector, globalEmmiter, overviews) {
        var _this2 = this;

        var $container = document.querySelector(selector);
        var $dom = document.createElement('div');
        $dom.className = 'charts'; // Main title and theme switcher

        var header = new Header(globalEmmiter);
        $dom.appendChild(header.$dom);
        overviews.forEach(function (dataset) {
          var ChartConstructor = null;
          var colorLabelsAxisY = null;
          var colorLabelsAxisX = null;
          if (dataset._type == 'lines') ChartConstructor = ChartLines;
          if (dataset._type == 'lines_scaled') ChartConstructor = ChartLines;
          if (dataset._type == 'bars') ChartConstructor = ChartBars;
          if (dataset._type == 'bars_single') ChartConstructor = ChartBars;
          if (dataset._type == 'percents') ChartConstructor = ChartPercents;
          if (!ChartConstructor) return;

          if (dataset._type == 'bars' || dataset._type == 'percents') {
            colorLabelsAxisY = 'AXIS_LABEL_ALT_Y';
            colorLabelsAxisX = 'AXIS_LABEL_ALT_X';
          }

          var chart = new ChartConstructor({
            type: dataset._type,
            data: dataset,
            dataLoader: _this2.dataLoader,
            globalEmmiter: globalEmmiter,
            colorLabelsAxisY: colorLabelsAxisY,
            colorLabelsAxisX: colorLabelsAxisX
          });
          $dom.appendChild(chart.$dom);
        }); // Fire theme changed event
        // Catch transition end event on special element
        // to prevent many events fired (if listen this event on body)

        var $transitionendEmmiter = document.createElement('div');
        $transitionendEmmiter.className = 'transitionend-emmiter';
        $transitionendEmmiter.addEventListener('transitionend', function () {
          globalEmmiter.emit('theme-changed');
        });
        $dom.appendChild($transitionendEmmiter); // Append charts dom element to container after adding child elements

        $container.appendChild($dom);
        globalEmmiter.on('theme-change', function (isDark) {
          document.body.className = isDark ? 'dark-theme' : '';
          setTimeout(function () {
            Colors.changeTheme(isDark);
          }, 15);
        });
        var resizeEmitTimeout;

        var resizeHandler = function resizeHandler() {
          clearTimeout(resizeEmitTimeout);
          resizeEmitTimeout = setTimeout(function () {
            globalEmmiter.emit('resize');
          }, 10);
        };

        window.addEventListener('resize', resizeHandler);
        window.addEventListener('orientationchange', resizeHandler);
        setTimeout(resizeHandler, 0);
        var lastTime = performance.now();
        requestAnimationFrame(function loop() {
          requestAnimationFrame(loop);
          var currentTime = performance.now();
          var delta = currentTime - lastTime;
          lastTime = currentTime;
          if (Colors.isChanging) Colors.update(delta);
          globalEmmiter.emit('render', delta);
        });
      }
    }]);

    return Charts;
  }();

  return Charts;

}());