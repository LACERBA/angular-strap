'use strict';

angular.module('mgcrea.ngStrap.timepicker', [
  'mgcrea.ngStrap.helpers.dateParser',
  'mgcrea.ngStrap.helpers.dateFormatter',
  'mgcrea.ngStrap.tooltip'])

  .provider('$timepicker', function() {

    var defaults = this.defaults = {
      animation: 'am-fade',
      //uncommenting the following line will break backwards compatability
      // prefixEvent: 'timepicker',
      prefixClass: 'timepicker',
      placement: 'bottom-left',
      template: 'timepicker/timepicker.tpl.html',
      trigger: 'focus',
      container: false,
      keyboard: true,
      html: false,
      delay: 0,
      // lang: $locale.id,
      useNative: true,
      timeType: 'date',
      timeFormat: 'shortTime',
      timezone: null,
      modelTimeFormat: null,
      autoclose: false,
      minTime: -Infinity,
      maxTime: +Infinity,
      length: 5,
      hourStep: 1,
      minuteStep: 5,
      secondStep: 5,
      roundDisplay: false,
      iconUp: 'glyphicon glyphicon-chevron-up',
      iconDown: 'glyphicon glyphicon-chevron-down',
      arrowBehavior: 'pager'
    };

    this.$get = function($window, $document, $rootScope, $sce, $dateFormatter, $tooltip, $timeout) {

      var bodyEl = angular.element($window.document.body);
      var isNative = /(ip(a|o)d|iphone|android)/ig.test($window.navigator.userAgent);
      var isTouch = ('createTouch' in $window.document) && isNative;
      if(!defaults.lang) defaults.lang = $dateFormatter.getDefaultLocale();

      function timepickerFactory(element, controller, config) {

        var $timepicker = $tooltip(element, angular.extend({}, defaults, config));
        var parentScope = config.scope;
        var options = $timepicker.$options;
        var scope = $timepicker.$scope;

        var lang = options.lang;
        var formatDate = function(date, format, timezone) {
          return $dateFormatter.formatDate(date, format, lang, timezone);
        };

        function floorMinutes(time)
        {
          // coeff used to floor current time to nearest minuteStep interval
          var coeff = 1000 * 60 * options.minuteStep;
          return new Date(Math.floor(time.getTime() / coeff) * coeff);
        }

        // View vars

        var selectedIndex = 0;
        var defaultDate = options.roundDisplay ? floorMinutes(new Date()) : new Date();
        var startDate = controller.$dateValue || defaultDate;
        var viewDate = {hour: startDate.getHours(), meridian: startDate.getHours() < 12, minute: startDate.getMinutes(), second: startDate.getSeconds(), millisecond: startDate.getMilliseconds()};

        var format = $dateFormatter.getDatetimeFormat(options.timeFormat, lang);

        var hoursFormat = $dateFormatter.hoursFormat(format),
          timeSeparator = $dateFormatter.timeSeparator(format),
          minutesFormat = $dateFormatter.minutesFormat(format),
          secondsFormat = $dateFormatter.secondsFormat(format),
          showSeconds = $dateFormatter.showSeconds(format),
          showAM = $dateFormatter.showAM(format);

        scope.$iconUp = options.iconUp;
        scope.$iconDown = options.iconDown;

        // Scope methods

        scope.$select = function(date, index) {
          $timepicker.select(date, index);
        };
        scope.$moveIndex = function(value, index) {
          $timepicker.$moveIndex(value, index);
        };
        scope.$switchMeridian = function(date) {
          $timepicker.switchMeridian(date);
        };

        // Public methods

        $timepicker.update = function(date) {
          // console.warn('$timepicker.update() newValue=%o', date);
          if(angular.isDate(date) && !isNaN(date.getTime())) {
            $timepicker.$date = date;
            angular.extend(viewDate, {hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds(), millisecond: date.getMilliseconds()});
            $timepicker.$build();
          } else if(!$timepicker.$isBuilt) {
            $timepicker.$build();
          }
        };

        $timepicker.select = function(date, index, keep) {
          // console.warn('$timepicker.select', date, scope.$mode);
          if(!controller.$dateValue || isNaN(controller.$dateValue.getTime())) controller.$dateValue = new Date(1970, 0, 1);
          if(!angular.isDate(date)) date = new Date(date);
          if(index === 0) controller.$dateValue.setHours(date.getHours());
          else if(index === 1) controller.$dateValue.setMinutes(date.getMinutes());
          else if(index === 2) controller.$dateValue.setSeconds(date.getSeconds());
          controller.$setViewValue(angular.copy(controller.$dateValue));
          controller.$render();
          if(options.autoclose && !keep) {
            $timeout(function() { $timepicker.hide(true); });
          }
        };

        $timepicker.switchMeridian = function(date) {
          if (!controller.$dateValue || isNaN(controller.$dateValue.getTime())) {
            return;
          }
          var hours = (date || controller.$dateValue).getHours();
          controller.$dateValue.setHours(hours < 12 ? hours + 12 : hours - 12);
          controller.$setViewValue(angular.copy(controller.$dateValue));
          controller.$render();
        };

        // Protected methods

        $timepicker.$build = function() {
          // console.warn('$timepicker.$build() viewDate=%o', viewDate);
          var i, midIndex = scope.midIndex = parseInt(options.length / 2, 10);
          var hours = [], hour;
          for(i = 0; i < options.length; i++) {
            hour = new Date(1970, 0, 1, viewDate.hour - (midIndex - i) * options.hourStep);
            hours.push({date: hour, label: formatDate(hour, hoursFormat), selected: $timepicker.$date && $timepicker.$isSelected(hour, 0), disabled: $timepicker.$isDisabled(hour, 0)});
          }
          var minutes = [], minute;
          for(i = 0; i < options.length; i++) {
            minute = new Date(1970, 0, 1, 0, viewDate.minute - (midIndex - i) * options.minuteStep);
            minutes.push({date: minute, label: formatDate(minute, minutesFormat), selected: $timepicker.$date && $timepicker.$isSelected(minute, 1), disabled: $timepicker.$isDisabled(minute, 1)});
          }
          var seconds = [], second;
          for(i = 0; i < options.length; i++) {
            second = new Date(1970, 0, 1, 0, 0, viewDate.second - (midIndex - i) * options.secondStep);
            seconds.push({date: second, label: formatDate(second, secondsFormat), selected: $timepicker.$date && $timepicker.$isSelected(second, 2), disabled: $timepicker.$isDisabled(second, 2)});
          }

          var rows = [];
          for(i = 0; i < options.length; i++) {
            if (showSeconds) {
              rows.push([hours[i], minutes[i], seconds[i]]);
            } else {
              rows.push([hours[i], minutes[i]]);
            }
          }
          scope.rows = rows;
          scope.showSeconds = showSeconds;
          scope.showAM = showAM;
          scope.isAM = ($timepicker.$date || hours[midIndex].date).getHours() < 12;
          scope.timeSeparator = timeSeparator;
          $timepicker.$isBuilt = true;
        };

        $timepicker.$isSelected = function(date, index) {
          if(!$timepicker.$date) return false;
          else if(index === 0) {
            return date.getHours() === $timepicker.$date.getHours();
          } else if(index === 1) {
            return date.getMinutes() === $timepicker.$date.getMinutes();
          } else if(index === 2) {
            return date.getSeconds() === $timepicker.$date.getSeconds();
          }
        };

        $timepicker.$isDisabled = function(date, index) {
          var selectedTime;
          if(index === 0) {
            selectedTime = date.getTime() + viewDate.minute * 6e4 + viewDate.second * 1e3;
          } else if(index === 1) {
            selectedTime = date.getTime() + viewDate.hour * 36e5 + viewDate.second * 1e3;
          } else if(index === 2) {
            selectedTime = date.getTime() + viewDate.hour * 36e5 + viewDate.minute * 6e4;
          }
          return selectedTime < options.minTime * 1 || selectedTime > options.maxTime * 1;
        };

        scope.$arrowAction = function (value, index) {
          if (options.arrowBehavior === 'picker') {
            $timepicker.$setTimeByStep(value,index);
          } else {
            $timepicker.$moveIndex(value,index);
          }
        };

        $timepicker.$setTimeByStep = function(value, index) {
          var newDate = new Date($timepicker.$date);
          var hours = newDate.getHours(), hoursLength = formatDate(newDate, hoursFormat).length;
          var minutes = newDate.getMinutes(), minutesLength = formatDate(newDate, minutesFormat).length;
          var seconds = newDate.getSeconds(), secondsLength = formatDate(newDate, secondsFormat).length;
          if (index === 0) {
            newDate.setHours(hours - (parseInt(options.hourStep, 10) * value));
          }
          else if (index === 1) {
            newDate.setMinutes(minutes - (parseInt(options.minuteStep, 10) * value));
          }
          else if (index === 2) {
            newDate.setSeconds(seconds - (parseInt(options.secondStep, 10) * value));
          }
          $timepicker.select(newDate, index, true);
        };

        $timepicker.$moveIndex = function(value, index) {
          var targetDate;
          if(index === 0) {
            targetDate = new Date(1970, 0, 1, viewDate.hour + (value * options.length), viewDate.minute, viewDate.second);
            angular.extend(viewDate, {hour: targetDate.getHours()});
          } else if(index === 1) {
            targetDate = new Date(1970, 0, 1, viewDate.hour, viewDate.minute + (value * options.length * options.minuteStep), viewDate.second);
            angular.extend(viewDate, {minute: targetDate.getMinutes()});
          } else if(index === 2) {
            targetDate = new Date(1970, 0, 1, viewDate.hour, viewDate.minute, viewDate.second + (value * options.length * options.secondStep));
            angular.extend(viewDate, {second: targetDate.getSeconds()});
          }
          $timepicker.$build();
        };

        $timepicker.$onMouseDown = function(evt) {
          // Prevent blur on mousedown on .dropdown-menu
          if(evt.target.nodeName.toLowerCase() !== 'input') evt.preventDefault();
          evt.stopPropagation();
          // Emulate click for mobile devices
          if(isTouch) {
            var targetEl = angular.element(evt.target);
            if(targetEl[0].nodeName.toLowerCase() !== 'button') {
              targetEl = targetEl.parent();
            }
            targetEl.triggerHandler('click');
          }
        };

        $timepicker.$onKeyDown = function(evt) {
          if (!/(38|37|39|40|13)/.test(evt.keyCode) || evt.shiftKey || evt.altKey) return;
          evt.preventDefault();
          evt.stopPropagation();

          // Close on enter
          if(evt.keyCode === 13) return $timepicker.hide(true);

          // Navigate with keyboard
          var newDate = new Date($timepicker.$date);
          var hours = newDate.getHours(), hoursLength = formatDate(newDate, hoursFormat).length;
          var minutes = newDate.getMinutes(), minutesLength = formatDate(newDate, minutesFormat).length;
          var seconds = newDate.getSeconds(), secondsLength = formatDate(newDate, secondsFormat).length;
          var sepLength = 1;
          var lateralMove = /(37|39)/.test(evt.keyCode);
          var count = 2 + showSeconds * 1 + showAM * 1;

          // Navigate indexes (left, right)
          if (lateralMove) {
            if(evt.keyCode === 37) selectedIndex = selectedIndex < 1 ? count - 1 : selectedIndex - 1;
            else if(evt.keyCode === 39) selectedIndex = selectedIndex < count - 1 ? selectedIndex + 1 : 0;
          }

          // Update values (up, down)
          var selectRange = [0, hoursLength];
          var incr = 0;
          if (evt.keyCode === 38) incr = -1;
          if (evt.keyCode === 40) incr = +1;
          var isSeconds = selectedIndex === 2 && showSeconds;
          var isMeridian = selectedIndex === 2 && !showSeconds || selectedIndex === 3 && showSeconds;
          if(selectedIndex === 0) {
            newDate.setHours(hours + incr*parseInt(options.hourStep, 10));
            // re-calculate hours length because we have changed hours value
            hoursLength = formatDate(newDate, hoursFormat).length;
            selectRange = [0, hoursLength];
          } else if(selectedIndex === 1) {
            newDate.setMinutes(minutes + incr*parseInt(options.minuteStep, 10));
            // re-calculate minutes length because we have changes minutes value
            minutesLength = formatDate(newDate, minutesFormat).length;
            selectRange = [hoursLength + sepLength, minutesLength];
          } else if(isSeconds) {
            newDate.setSeconds(seconds + incr*parseInt(options.secondStep, 10));
            // re-calculate seconds length because we have changes seconds value
            secondsLength = formatDate(newDate, secondsFormat).length;
            selectRange = [hoursLength + sepLength + minutesLength + sepLength, secondsLength];
          } else if(isMeridian) {
            if(!lateralMove) $timepicker.switchMeridian();
            selectRange = [hoursLength + sepLength + minutesLength + sepLength + (secondsLength + sepLength)*showSeconds, 2];
          }
          $timepicker.select(newDate, selectedIndex, true);
          createSelection(selectRange[0], selectRange[1]);
          parentScope.$digest();
        };

        // Private

        function createSelection(start, length) {
          var end = start + length;
          if(element[0].createTextRange) {
            var selRange = element[0].createTextRange();
            selRange.collapse(true);
            selRange.moveStart('character', start);
            selRange.moveEnd('character', end);
            selRange.select();
          } else if(element[0].setSelectionRange) {
            element[0].setSelectionRange(start, end);
          } else if(angular.isUndefined(element[0].selectionStart)) {
            element[0].selectionStart = start;
            element[0].selectionEnd = end;
          }
        }

        function focusElement() {
          element[0].focus();
        }

        // Overrides

        var _init = $timepicker.init;
        $timepicker.init = function() {
          if(isNative && options.useNative) {
            element.prop('type', 'time');
            element.css('-webkit-appearance', 'textfield');
            return;
          } else if(isTouch) {
            element.prop('type', 'text');
            element.attr('readonly', 'true');
            element.on('click', focusElement);
          }
          _init();
        };

        var _destroy = $timepicker.destroy;
        $timepicker.destroy = function() {
          if(isNative && options.useNative) {
            element.off('click', focusElement);
          }
          _destroy();
        };

        var _show = $timepicker.show;
        $timepicker.show = function() {
          _show();
          // use timeout to hookup the events to prevent
          // event bubbling from being processed imediately.
          $timeout(function() {
            $timepicker.$element && $timepicker.$element.on(isTouch ? 'touchstart' : 'mousedown', $timepicker.$onMouseDown);
            if(options.keyboard) {
              element && element.on('keydown', $timepicker.$onKeyDown);
            }
          }, 0, false);
        };

        var _hide = $timepicker.hide;
        $timepicker.hide = function(blur) {
          if(!$timepicker.$isShown) return;
          $timepicker.$element && $timepicker.$element.off(isTouch ? 'touchstart' : 'mousedown', $timepicker.$onMouseDown);
          if(options.keyboard) {
            element && element.off('keydown', $timepicker.$onKeyDown);
          }
          _hide(blur);
        };

        return $timepicker;

      }

      timepickerFactory.defaults = defaults;
      return timepickerFactory;

    };

  })


  .directive('bsTimepicker', function($window, $parse, $q, $dateFormatter, $dateParser, $timepicker) {

    var defaults = $timepicker.defaults;
    var isNative = /(ip(a|o)d|iphone|android)/ig.test($window.navigator.userAgent);
    var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;

    return {
      restrict: 'EAC',
      require: 'ngModel',
      link: function postLink(scope, element, attr, controller) {

        // Directive options
        var options = {scope: scope, controller: controller};
        angular.forEach(['placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'template', 'autoclose', 'timeType', 'timeFormat', 'timezone', 'modelTimeFormat', 'useNative', 'hourStep', 'minuteStep', 'secondStep', 'length', 'arrowBehavior', 'iconUp', 'iconDown', 'roundDisplay', 'id', 'prefixClass', 'prefixEvent'], function(key) {
          if(angular.isDefined(attr[key])) options[key] = attr[key];
        });

        // use string regex match boolean attr falsy values, leave truthy values be
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach(['html', 'container', 'autoclose', 'useNative', 'roundDisplay'], function(key) {
          if(angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key]))
            options[key] = false;
        });

        // Visibility binding support
        attr.bsShow && scope.$watch(attr.bsShow, function(newValue, oldValue) {
          if(!timepicker || !angular.isDefined(newValue)) return;
          if(angular.isString(newValue)) newValue = !!newValue.match(/true|,?(timepicker),?/i);
          newValue === true ? timepicker.show() : timepicker.hide();
        });

        // Initialize timepicker
        if(isNative && (options.useNative || defaults.useNative)) options.timeFormat = 'HH:mm';
        var timepicker = $timepicker(element, controller, options);
        options = timepicker.$options;

        var lang = options.lang;
        var formatDate = function(date, format, timezone) {
          return $dateFormatter.formatDate(date, format, lang, timezone);
        };

        // Initialize parser
        var dateParser = $dateParser({format: options.timeFormat, lang: lang});

        // Observe attributes for changes
        angular.forEach(['minTime', 'maxTime'], function(key) {
          // console.warn('attr.$observe(%s)', key, attr[key]);
          angular.isDefined(attr[key]) && attr.$observe(key, function(newValue) {
            timepicker.$options[key] = dateParser.getTimeForAttribute(key, newValue);
            !isNaN(timepicker.$options[key]) && timepicker.$build();
            validateAgainstMinMaxTime(controller.$dateValue);
          });
        });

        // Watch model for changes
        scope.$watch(attr.ngModel, function(newValue, oldValue) {
          // console.warn('scope.$watch(%s)', attr.ngModel, newValue, oldValue, controller.$dateValue);
          timepicker.update(controller.$dateValue);
        }, true);

        function validateAgainstMinMaxTime(parsedTime) {
          if (!angular.isDate(parsedTime)) return;
          var isMinValid = isNaN(options.minTime) || new Date(parsedTime.getTime()).setFullYear(1970, 0, 1) >= options.minTime;
          var isMaxValid = isNaN(options.maxTime) || new Date(parsedTime.getTime()).setFullYear(1970, 0, 1) <= options.maxTime;
          var isValid = isMinValid && isMaxValid;
          controller.$setValidity('date', isValid);
          controller.$setValidity('min', isMinValid);
          controller.$setValidity('max', isMaxValid);
          // Only update the model when we have a valid date
          if(!isValid) {
              return;
          }
          controller.$dateValue = parsedTime;
        }

        // viewValue -> $parsers -> modelValue
        controller.$parsers.unshift(function(viewValue) {
          // console.warn('$parser("%s"): viewValue=%o', element.attr('ng-model'), viewValue);
          var date;
          // Null values should correctly reset the model value & validity
          if(!viewValue) {
            // BREAKING CHANGE:
            // return null (not undefined) when input value is empty, so angularjs 1.3
            // ngModelController can go ahead and run validators, like ngRequired
            controller.$setValidity('date', true);
            return null;
          }
          var parsedTime = angular.isDate(viewValue) ? viewValue : dateParser.parse(viewValue, controller.$dateValue);
          if(!parsedTime || isNaN(parsedTime.getTime())) {
            controller.$setValidity('date', false);
            // return undefined, causes ngModelController to
            // invalidate model value
            return;
          } else {
            validateAgainstMinMaxTime(parsedTime);
          }

          if(options.timeType === 'string') {
            date = dateParser.timezoneOffsetAdjust(parsedTime, options.timezone, true);
            return formatDate(date, options.modelTimeFormat || options.timeFormat);
          }
          date = dateParser.timezoneOffsetAdjust(controller.$dateValue, options.timezone, true);
          if(options.timeType === 'number') {
            return date.getTime();
          } else if(options.timeType === 'unix') {
            return date.getTime() / 1000;
          } else if(options.timeType === 'iso') {
            return date.toISOString();
          } else {
            return new Date(date);
          }
        });

        // modelValue -> $formatters -> viewValue
        controller.$formatters.push(function(modelValue) {
          // console.warn('$formatter("%s"): modelValue=%o (%o)', element.attr('ng-model'), modelValue, typeof modelValue);
          var date;
          if(angular.isUndefined(modelValue) || modelValue === null) {
            date = NaN;
          } else if(angular.isDate(modelValue)) {
            date = modelValue;
          } else if(options.timeType === 'string') {
            date = dateParser.parse(modelValue, null, options.modelTimeFormat);
          } else if(options.timeType === 'unix') {
            date = new Date(modelValue * 1000);
          } else {
            date = new Date(modelValue);
          }
          // Setup default value?
          // if(isNaN(date.getTime())) date = new Date(new Date().setMinutes(0) + 36e5);
          controller.$dateValue = dateParser.timezoneOffsetAdjust(date, options.timezone);
          return getTimeFormattedString();
        });

        // viewValue -> element
        controller.$render = function() {
          // console.warn('$render("%s"): viewValue=%o', element.attr('ng-model'), controller.$viewValue);
          element.val(getTimeFormattedString());
        };

        function getTimeFormattedString() {
          return !controller.$dateValue || isNaN(controller.$dateValue.getTime()) ? '' : formatDate(controller.$dateValue, options.timeFormat);
        }

        // Garbage collection
        scope.$on('$destroy', function() {
          if (timepicker) timepicker.destroy();
          options = null;
          timepicker = null;
        });

      }
    };

  });
