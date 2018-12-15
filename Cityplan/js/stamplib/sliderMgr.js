/**
 * 作    者：StampGIS Team
 * 创建日期：2015年1月21日
 * 描    述：地形透明、雨、雪、雾等slider拉杆条公共脚本js
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

(function(ns) {
    var _earth = null,
    	_closure = null,//关闭时的回调方法
        VERSION = '0.0.1',
        TOP = 0,//位置Y
        LEFT = top.dialogLeft?top.dialogLeft:86;//位置X

    //slider对象
    var _sliders = [{
        type: 'transparency',
        title: '地形透明',
        slider: null,
        percent: 100,
        changeValue: function(slider, value) {//修改值
            if (!slider || value < 0 || value > 100) {
                return;
            }
            _earth.Environment.TerrainTransparency = value * 2.55;
            slider.Text = "不透明度:" + value + '%';
        }
    }, {
        type: 'rain',
        title: '雨',
        slider: null,
        percent: 100,
        parse: function(slider, value) {
            try {
                value = Math.floor(parseFloat(value) / 20);
                return value == 5 ? 4 : value;
            } catch (e) {
                return value;
            }
        },
        changeValue: function(slider, value) {
            if (!slider || value < 1 || value > 4) {
                _earth.WeatherEffect.SetRainEnable(false);
                slider.Text = '晴';
            } else {
                _earth.WeatherEffect.SetRainEnable(true);
                _earth.WeatherEffect.SetRainType(value);
                var rainText = ['小雨', '中雨', '大雨', '暴雨'];
                slider.Text = rainText[value - 1];
            }
        }
    }, {
        type: 'snow',
        title: '雪',
        slider: null,
        percent: 100,
        parse: function(slider, value) {
            try {
                value = Math.floor(parseFloat(value) / 20);
                return value == 5 ? 4 : value;
            } catch (e) {
                return value;
            }
        },
        changeValue: function(slider, value) {
            if (!slider || value < 1 || value > 4) {
                _earth.WeatherEffect.SetSnowEnable(false);
                slider.Text = '晴';
            } else {
                _earth.WeatherEffect.SetSnowEnable(true);
                _earth.WeatherEffect.SetSnowType(value);
                var snowText = ['小雪', '中雪', '大雪', '暴雪'];
                slider.Text = snowText[value - 1];
            }
        }
    }, {
        type: 'fog',
        title: '雾',
        slider: null,
        percent: 100,
        parse: function(slider, value) {
            try {
                value = Math.floor(parseFloat(value) / 20);
                return value == 5 ? 4 : value;
            } catch (e) {
                return value;
            }
        },
        changeValue: function(slider, value) {
            if (!slider || value < 1 || value > 4) {
                _earth.WeatherEffect.SetFogEnable(false);
                slider.Text = '晴';
            } else {
                _earth.WeatherEffect.SetFogEnable(true);
                _earth.WeatherEffect.SetFogType(value);
                var fogText = ['小雾', '中雾', '大雾', '大大雾'];
                slider.Text = fogText[value - 1];
            }
        }
    }];

    /**
     * 默认值赋值
     * @param  {[type]} obj          [对象]
     * @param  {[type]} property     [属性]
     * @param  {[type]} defaultValue [默认值]
     * @return {[type]}              [description]
     */
    function _valueOrDefault(obj, property, defaultValue) {
        try {
            if (!obj || typeof obj[property] == 'undefined') {
                return defaultValue;
            }

            return obj[property];
        } catch (e) {
            return defaultValue;
        }
    }

    /**
     * 根据ID找到slider
     * @param  {[type]} id [description]
     * @return {[type]}    [description]
     */
    function _getSliderById(id) {
        for (var i = 0; i < _sliders.length; i++) {
            if (_sliders[i].slider && _sliders[i].slider.ID == id) {
                return _sliders[i];
            }
        }
        return null;
    }

    /**
     * 根据type找到slider
     * @param  {[type]} type [description]
     * @return {[type]}      [description]
     */
    function _getSlider(type) {
        for (var i = 0; i < _sliders.length; i++) {
            if (_sliders[i].type == type) {
                return _sliders[i];
            }
        }
        return null;
    }

    /**
     * slider值发生改变事件
     * @param  {[type]} id      [description]
     * @param  {[type]} percent [description]
     * @return {[type]}         [description]
     */
    function _onSlider_changed(id, percent) {
        var slider = _getSliderById(id);
        if (!slider || !slider.slider) {
            return;
        }
        var v = percent;
        if (typeof slider.parse == 'function') {
            v = slider.parse(slider.slider, v);
        }
        slider.changeValue(slider.slider, v);
        slider.percent = percent;
    }

    /**
     * slider关闭事件
     * @param  {[type]} id [description]
     * @return {[type]}    [description]
     */
    function _onSlider_closed(id){
        
    	var slider = _getSliderById(id);
        if (!slider || !slider.slider) {
            return;
        }
        slider.changeValue(slider.slider, -1);
        if(typeof _closure == 'function'){
        	_closure(slider.type);
        }
    }

    /**
     * slider管理工具
     */
    var _sliderMgr = {
        /**
         * 初始化拉杆条
         * @param  {[type]} earth   [earth对象]
         * @param  {[type]} force   [强制赋值]
         * @param  {[type]} closure [关闭回调事件]
         * @return {[type]}         [description]
         */
        init: function(earth, force, closure) {
            if (!_earth || force) {
                _earth = earth;
            }
            if(!_closure || force){
            	_closure = closure;
            }
        },
        
        /**
         * 设置哪一个滚动条可见
         * @param {[type]} type    [description]
         * @param {[type]} visible [description]
         */
        setVisible: function(type, visible) {
            if (!_earth || !_earth.GUIManager) {
                return;
            }
            var slider = _getSlider(type);
            if (!slider.slider) {
                var top = _valueOrDefault(slider, 'top', TOP);
                var left = _valueOrDefault(slider, 'left', LEFT);
                var s = _earth.GUIManager.CreateSlider(left, top);
                s.Title = slider.title;
                slider.slider = s;
                if(slider.type == "transparency"){
                    slider.slider.Value = 1;//0.5;
                }
                _onSlider_changed(s.ID, slider.percent);
            }
            _earth.GUIManager.SetWindowVisible(slider.slider.ID, visible);
            if (visible) {
                _onSlider_changed(slider.slider.ID, slider.percent);
            } else {
                slider.changeValue(slider.slider, -1);
            }
            _earth.Event.OnGUISliderChanged = function(id, percent){
                _onSlider_changed(id, percent);
                var s = _getSliderById(id);
                $(ns).trigger('sliderChanged.sliderMgr', {
                    type: s.type,
                    value: percent
                });
            };
            _earth.Event.OnGUISliderClosed = _onSlider_closed;
        },

        /**
         * 清除拉杆条
         * @return {[type]} [description]
         */
        clear: function() {
            if (_earth && _earth.GUIManager) {
                _earth.GUIManager.Clear();
            }
            for (var i = 0; i < _sliders.length; i++) {
                _sliders[i].slider = null;
            }
        },
        version: VERSION
    };

    /*========================================
      =            export sliderMgr          =
      ========================================*/
    if ((typeof module) !== 'undefined' && module.exports) {
        //check for CommonJS
        module.exports = _sliderMgr;
    } else if ((typeof define) === 'function' && define.amd) {
        //check for AMD
        define([], function() {
            return _sliderMgr;
        });
    } else {
        ns.sliderMgr = _sliderMgr;
    }
    /*-----  End of export sliderMgr  ------*/
})(window);
