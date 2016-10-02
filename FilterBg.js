/* Photoshop-style Filtered Backgrounds
 *
 * MIT License
 * Requires jquery 1.5+ (For now)
 *
 */

(function(window) {

	var scriptUrl = "html2canvas.js";

	var dependencyLoader = {

		status: "READY",

		loadLibraries: function() {
			var promise = $.Deferred();

			if (typeof window.html2canvas !== 'undefined') {
				this.status = "DONE";
				promise.resolve();
			} else {
				this.attachScript(promise);
			}
			return promise;
		},

		attachScript: function(promise) {
			var self = this;
			var script = window.document.createElement('script');
			script.src = scriptUrl;
			script.onload = function () {
				self.handleLoadedScript(promise);
			};

			window.document.head.appendChild(script);

			return promise;
		},

		handleLoadedScript: function(promise, script) {
			if (window.html2canvas) {
				self.status = "DONE";
				window.html2canvas = html2canvas
				promise.resolve();
			} else {
				this.status = "FAILED";
				console.error("FAILED TO LOAD HTML2CANVAS SCRIPT");
				promise.reject();
			}
		}
	};


	var renderer = {

		target: null,

		options: {
			logging: true,
			useCORS: true,
			effects: {
				invert: 90,
				"hue-rotate": 90,
				saturate: 300,
				contrast: 30,
				brightness: 40,
				blur: 3
			}
		},

		screen: null,

		canvas: null,

		filterUnits: {
			"default": "%",
			"blur": "px",
			"hue-rotate": "deg",
			"url": ""
		},


		makeScreenshot: function() {
			var self = this;
			var promise = $.Deferred();

			window.html2canvas(this.screen, this.options)
				.then(function(canvas) {
					self.canvas = $(canvas);
					promise.resolve();
				});

			return promise;
		},

		attachBackground: function() {
		    this.positionCanvas();
			this.target.append(this.canvas);
		},

		styleParent: function() {
			if (this.target.css("position") !== "absolute") {
				this.target.css("position", "relative");
			}
		},

		positionCanvas: function() {	
		    var dialogPos = this.target.offset();
		    var xPos = dialogPos.left - $(window).scrollLeft();
		    var yPos = dialogPos.top - $(window).scrollTop();

		    this.canvas.css({
		    	'top':  '-' + yPos + 'px',
		    	'left': '-' + xPos + 'px',
		    	'position': "absolute"
		    });
		},

		addEffects: function() {
			var self = this;
			var filterString = Object.keys(this.options.effects).reduce(function(prev, curr) {
				var value = (curr === 'url') ? self.options.effects[curr] : parseInt(self.options.effects[curr], 10);
				var unit = self.filterUnits[curr] || self.filterUnits.default;

				var formatted = curr + "(" + value + unit + ") ";
				return prev += formatted;
			}, "");

			this.canvas.css({
				"-webkit-filter": filterString,
				"filter": filterString
			});
		},

		render: function() {
			var self = this;
			var promise = $.Deferred();
			this.makeScreenshot()
				.then(function() {
					self.styleParent();
				    self.addEffects();
		    		self.canvas.addClass('filter-bg');
					self.attachBackground();
					promise.resolve();
				});

			return promise;
		}
	}

	var FilterBg = function(target, options) {
		options = typeof options === 'object' ? options : {};

		renderer.target = target;
		renderer.options = $.extend({}, renderer.options, options);
		renderer.options.effects = $.extend({}, renderer.options.effects, options.effects);
		renderer.screen = $("body");

		dependencyLoader.loadLibraries(target)
			.then(renderer.render.bind(renderer));

		return {

			target: $(target),

			dependencyLoader: dependencyLoader,

			renderer: renderer,

			onOpen: function() {
				this.update();
			},

			onClose: function() {
				this.clear();
			},

			update: function() {
				return renderer.render(this.target);
			},

			clear: function() {
				var canvas = $(this.target).find(".filter-bg");

				if (canvas.length > 0) {
					canvas.remove();
				}
			},

			setTarget: function(target, /* optional */ update) {
				this.target = $(target);

				if (typeof update !== 'undefined' && update) {
					this.update();
				}
			},

			setEffects: function(effects, /* optional */ update) {
				if (typeof effects === 'object') {
					renderer.options.effects = $.extend({}, renderer.options.effects, effects);	
				}

				if (typeof update !== 'undefined' && update) {
					this.update();
				}
			}
		}
	}

	window.FilterBg = FilterBg;

})(window);