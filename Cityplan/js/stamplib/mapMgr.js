/**
 * 作    者：StampGIS Team
 * 创建日期：2014年7月2日
 * 描    述：字段映射
 * 注意事项：依赖jquery.js,jquery.xml2json.js
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

(function(np) {
    if (np == undefined) {
        np = {};
    }
    var mapMgr = np.mapMgr;
    if (mapMgr == undefined) {
        mapMgr = {};
    }
    
    //字段映射表(xml格式)
    var fieldMapXml = undefined;

    //字段映射表(json格式)
    var fieldMapJson = undefined;

    var fieldKeyIndex = ['', 'StandardName', 'CaptionName', 'FieldName']

    //图层映射表(json格式),mgr中未提供图层映射接口,故此处写死，一般不会改变
    //add nodeName:CantonFieldInfo,CompanyFieldInfo at 2014-11-18
    var layerMapJson = {
        layerMap: [{
            layerName: '',
            displayName: '',
            nodeName: 'BuildingFieldInfo',
            dataType: 'currentbuilding'
        }, {
            layerName: '',
            displayName: '',
            nodeName: 'GreenbeltFieldInfo',
            dataType: 'plangreenbelt'
        }, {
            layerName: '',
            displayName: '',
            nodeName: 'RegulatoryfigureFieldInfo',
            dataType: 'regulatoryfigure'
        }, {
            layerName: '',
            displayName: '',
            nodeName: 'RoadFieldInfo',
            dataType: 'currentroad'
        }, {
            layerName: '',
            displayName: '',
            nodeName: 'POIFieldInfo',
            dataType: ''
        }, {
            layerName: '',
            displayName: '',
            nodeName: 'LandFieldInfo',
            dataType: 'planland'
        }, {
            layerName: '',
            displayName: '',
            nodeName: 'LandFieldInfo',
            dataType: 'currentland'
        }, {
            layerName: '',
            displayName: '',
            nodeName: 'CantonFieldInfo',
            dataType: 'Canton'
        }, {
            layerName: '',
            displayName: '',
            nodeName: 'CompanyFieldInfo',
            dataType: 'Company'
        }]
    };
    var layerKeyIndex = ['', 'layerName', 'displayName', 'nodeName', 'dataType'];
    var keyValueMap = {}; //暂未使用

    /**
     * 解析字段映射xml成json
     * @param  {[type]} layerXml [暂时未用到]
     * @param  {[type]} fieldXml [字段映射xml]
     * @return {[type]}          [description]
     */
    var _init = function(layerXml, fieldXml) {
        _initField(fieldXml);
    }

    /**
     * 初始化字段xml成json对象
     * @param  {[type]} fieldXml [字段映射xml]
     * @return {[type]}          [description]
     */
    var _initField = function(fieldXml) {
        try {
            if (fieldXml == undefined || fieldXml == '') {
                return;
            }

            fieldMapXml = fieldXml;
            fieldMapJson = $.xml2json(fieldMapXml);
        } catch (e) {

        }
    }

    /**
     * 获取字段映射节点
     * @param  {[type]} np    [description]
     * @param  {[type]} key   [description]
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
     */
    var _getObj = function(np, key, value) {
        var pObj = _getValueByKey(np);
        if (pObj == undefined) {
            return undefined;
        }

        var des = undefined;
        $.each(pObj, function(i, n) {
            try {
                if (n[key] == value) {
                    des = {};
                    $.extend(des, n);
                }
            } catch (e) {
                return;
            }
        });

        return des;
    }

    /**
     * 获取值
     * @param  {[type]} key [字段值]
     * @return {[type]}     [description]
     */
    var _getValueByKey = function(key) {
        try {
            return eval(key);
        } catch (e) {
            return undefined;
        }
    }

    /**
     * 获取由key和sflag指定的图层的映射信息,由dflag指定获取的结果
     * @param key string 目标图层的某已定映射字段值
     * @param sflag int key所属的映射字段名标识
     * @param dflag int 目标图层的映射字段名标识
     * @return object | string 由dflag指定的目标图层信息
     *
     * sflag,dflag可取值:
     * 0:layerMap object
     * 1:layerName string
     * 2:displayName string
     * 3:nodeName string
     * 4:dataType string
     */
    mapMgr.getLayer = function(key, sflag, dflag) {
        try {
            if (isNaN(sflag)) {
                return undefined;
            }

            var obj = _getObj('layerMapJson.layerMap', layerKeyIndex[sflag], key);
            if (obj == undefined) {
                return undefined;
            }
            if (isNaN(dflag)) {
                return obj;
            }
            if (dflag > 0 && dflag < 5) {
                return obj[layerKeyIndex[dflag]];
            }

            return obj;
        } catch (e) {
            return undefined;
        }
    }

    /**
     * 获取指定图层的指定字段信息
     * @param fieldKey string 目标字段的某已定属性值
     * @param layerKey string 目标图层的某已定属性值
     * @param lsflag int layerKey所属的属性名标识
     * @param fsflag int fieldKey所属的属性名标识
     * @param fdflag int 目标字段的属性名标识
     * @return object | string 由fdflag指定的目标字段信息
     *
     * lsflag可取值:
     * 0:layerMap object
     * 1:layerName string
     * 2:displayName string
     * 3:nodeName string
     * 4:dataType string
     *
     * fsflag,fdflag可取值:
     * 0:FieldMapItem object
     * 1:StandardName string
     * 2:CaptionName string
     * 3:FieldName string
     */
    mapMgr.getField = function(fieldKey, layerKey, lsflag, fsflag, fdflag) {
        try {
            var ldflag = 3;
            var layerNodeName = mapMgr.getLayer(layerKey, lsflag, ldflag);
            if (layerNodeName == undefined) {
                return undefined;
            }

            var fnp = 'fieldMapJson.' + layerNodeName + '.SystemFieldList.FieldMapItem';
            var obj = _getObj(fnp, fieldKeyIndex[fsflag], fieldKey);
            if (obj == undefined) {
                fnp = 'fieldMapJson.' + layerNodeName + '.CustomerFieldList.FieldMapItem';
                obj = _getObj(fnp, fieldKeyIndex[fsflag], fieldKey);
                if (obj == undefined) {
                    return undefined;
                }
            }
            if (isNaN(fdflag)) {
                return obj;
            }
            if (fdflag > 0 && fdflag < 4) {
                return obj[fieldKeyIndex[fdflag]];
            }

            return obj;
        } catch (e) {
        }
    }

    /**
     * 根据标准字段获取某图层相应的真字段
     * @param standardField string 标准字段
     * @param dataType string 目标图层的DataType
     * @return string 目标图层的真字段
     */
    mapMgr.getTrueField = function(standardField, dataType) {
        //根据图层DataType取得图层映射表中相应的NodeName
        var layerNodeName = 'POIFieldInfo';
        if (dataType != undefined && dataType != '') {
            layerNodeName = mapMgr.getLayer(dataType.toLowerCase(), 4, 3);
            if (layerNodeName == undefined || layerNodeName == "") {
                //未配置的图层按POI图层处理
                layerNodeName = 'POIFieldInfo';
            }
        }

        var trueField = mapMgr.getField(standardField, layerNodeName, 3, 1, 3);
        if (trueField == undefined || trueField == '') {
            //未配置的字段,不做转换
            trueField = standardField;
        }

        return trueField;
    }

    /**
     * 初始化字段映射（解析字段映射xml成json）
     * @param  {[type]} layerXml [暂未用到]
     * @param  {[type]} fieldXml [规划字段映射xml]
     * @return {[type]}          [description]
     */
    mapMgr.init = function(layerXml, fieldXml) {
        _init(layerXml, fieldXml);
    }

    /**
     * 判断是否初始化了字段映射
     * @return {[type]} [description]
     */
    mapMgr.inited = function() {
        return (fieldMapXml && fieldMapJson);
    }

    np.mapMgr = mapMgr;
})(window)
