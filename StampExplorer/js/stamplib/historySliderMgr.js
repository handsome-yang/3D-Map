/**
 * 作       者：StampGIS Team
 * 创建日期：2017年 7月 22日
 * 描       述：历史管理相关功能
 * 注意事项：
 * 遗留 Bug：0
 * 修改日期：2017年 11月 13日
 ******************************************/

var lastDate = 0; //最后日期
(function(ns) {
	var VERSION = '0.0.1';

	var TOP = 0;

	var LEFT = 80;

	var SeHistorySliderMgr = null;
	var SetDemcrazySliderMgr = null;

	/**
	 * 设置默认值
	 * @param {Object} obj 对象
	 * @param {Object} property  属性
	 * @param {Object} defaultValue 默认值
	 */
	function _valueOrDefault(obj, property, defaultValue) {
		try {
			if(!obj || typeof obj[property] == 'undefined') {
				return defaultValue;
			}

			return obj[property];
		} catch(e) {
			return defaultValue;
		}
	}
	SeHistorySliderMgr = function(options) {
		if(!(this instanceof SeHistorySliderMgr)) {
			return new SeHistorySliderMgr(options);
		}
		this.initialize.apply(this, arguments);
	}
	//使用夸张系数拉杆条
	SetDemcrazySliderMgr = function(options) {
		if(!(this instanceof SetDemcrazySliderMgr)) {
			return new SetDemcrazySliderMgr(options);
		}
		this.initialize.apply(this, arguments);
	}
	var setFocus = function(id) {

	}
	$.extend(SetDemcrazySliderMgr.prototype, {
		initialize: function(options) {
			var me = this;
			me.data = {};
			me.callback = {};
			me.callback['onAllClose'] = _valueOrDefault(options, 'onAllClose', null);
		},
		showSliderDom: function(options) {
			var me = this;
			var earth = _valueOrDefault(options, 'earth', null);
			if(earth == null) {
				return;
			}
			var id = earth.id;
			var data = me.data[id];
			if(data == null) {
				data = me.data[id] = {};
			}
			if(data['earth'] == null) {
				data['earth'] = earth;
			}
			var slider = data['slider'];
			var visible = _valueOrDefault(options, 'visible', false);
			if(visible) {
				if(slider == null) {
					var x = _valueOrDefault(options, 'x', LEFT);
					var y = _valueOrDefault(options, 'y', TOP);
					var t = _valueOrDefault(options, 'title', '');
					slider = data['slider'] = earth.GUIManager.CreateTerrainScaleSlider(x, y);
					slider.Title = t;

					earth.Event.OnGUISliderClosed = function(id) {
						for(var i in me.data) {
							if(me.data[i] && me.data[i]['slider']) {
								if(me.data[i]['slider'].ID == id) {
									me.data[i]['visible'] = false;
								} else if(me.data[i]['visible']) {
									return;
								}
							}
						}

						var onAllClose = _valueOrDefault(options, 'onAllClose', me.callback['onAllClose']);
						if(typeof onAllClose == 'function') {
							onAllClose();
						}
					}
				}
				earth.GUIManager.SetWindowVisible(slider.ID, visible);
			} else {
				if(slider != null) {
					earth.GUIManager.SetWindowVisible(slider.ID, visible);
					if(_valueOrDefault(options, 'destroy', false)) {
						earth.GUIManager.Clear();
						delete me.data[id];
					}
				}
			}
			data['visible'] = visible;
		},
		destroy: function() {
			var me = this;
			for(var i in me.data) {
				if(me.data[i] && me.data[i]['earth']) {
					me.data[i]['earth'].GUIManager.Clear();
					delete me.data[i];
				}
			}
		},
		version: VERSION
	});
	$.extend(SeHistorySliderMgr.prototype, {
		initialize: function(options) {
			var me = this;
			me.data = {};
			me.callback = {};
			me.callback['onAllClose'] = _valueOrDefault(options, 'onAllClose', null);
		},
		showSlider: function(options) {
			var me = this;
			var earth = _valueOrDefault(options, 'earth', null);
			if(earth == null) {
				return;
			}
			var id = earth.id;
			var data = me.data[id];
			if(data == null) {
				data = me.data[id] = {};
			}
			if(data['earth'] == null) {
				data['earth'] = earth;
			}
			var slider = data['slider'];
			var visible = _valueOrDefault(options, 'visible', false);
			if(visible) {
				if(slider == null) {
					var x = _valueOrDefault(options, 'x', LEFT);
					var y = _valueOrDefault(options, 'y', 0);
					var t = _valueOrDefault(options, 'title', '');
					slider = data['slider'] = earth.GUIManager.CreateHistorySlider(x, y);
					slider.Title = t;
					earth.Event.OnGUISliderClosed = function(id) {
						if(top.bSync && top.isCloseSlider) { //1696联动状态下要关闭所有的拉杆条
							for(var k in seHistorySliderMgr.data) { //j=seearth seearth1
								j = seHistorySliderMgr.data[k];
								if(j.slider) {
									var tempSliderId = j.slider.id;
									if(tempSliderId != id) {
										top.isCloseSlider = false;
										j.earth.GUIManager.SetWindowVisible(tempSliderId, false);
									}
								}
							}
						}

						for(var i in me.data) {
							if(me.data[i] && me.data[i]['slider']) {
								if(me.data[i]['slider'].ID == id) {
									me.data[i]['slider'].ResumeNormalData();
									me.data[i]['visible'] = false;
								} else if(me.data[i]['visible']) {
									return;
								}
							}
						}
						//移到下面的for前面执行
						var onAllClose = _valueOrDefault(options, 'onAllClose', me.callback['onAllClose']);
						if(typeof onAllClose == 'function') {
							onAllClose();
						}
					}
					earth.Event.OnGUISliderChanged = function(id) {
						
					}
				}
				earth.GUIManager.SetWindowVisible(slider.ID, visible);
			} else {
				if(slider != null) {
					earth.GUIManager.SetWindowVisible(slider.ID, visible);
					if(_valueOrDefault(options, 'destroy', false)) {
						earth.GUIManager.Clear();
						delete me.data[id];
					}
				}
			}
			data['visible'] = visible;
		},
		destroy: function() {
			var me = this;
			for(var i in me.data) {
				if(me.data[i] && me.data[i]['earth']) {
					me.data[i]['earth'].GUIManager.Clear();
					delete me.data[i];
				}
			}
		},
		version: VERSION
	});

	/*=================================================
	=            export SeHistorySliderMgr            =
	=================================================*/
	if((typeof module) !== 'undefined' && module.exports) {
		//for CommonJS
		module.exports = SeHistorySliderMgr;
	} else if((typeof define) === 'function' && define.amd) {
		//for AMD
		define([], function() {
			return SeHistorySliderMgr;
		});
	} else {
		if(ns.STAMP == null) {
			ns.STAMP = {};
		}
		ns.STAMP.SeHistorySliderMgr = SeHistorySliderMgr;
		ns.STAMP.SetDemcrazySliderMgr = SetDemcrazySliderMgr;
	}
	/*-----  End of export SeHistorySliderMgr  ------*/

})(window);