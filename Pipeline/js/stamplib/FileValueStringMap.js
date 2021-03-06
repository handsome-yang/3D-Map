/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：管线的编码映射
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 **************************************************/
var FieldValueStringMap = {};
(function () {
    /**
     * 根据图层类型获取到图层名称
     * @param {[string]} type  [图层类型]
     * @returns {[string]}     [图层名称]
     */
    var GetLayerTypeString = function (type) {
        switch (type) {
            case "Electricity":
                return "电力电缆";
            case "Energetics":
                return "热力管线";
            case "FeedWater":
                return "供水管线";
            case "Gas":
                return "燃气管线";
            case "Industry":
                return "工业管线";
            case "Rain":
                return "雨水管线";
            case "Road":
                return "道路";
            case "Sewage":
                return "污水管线";
            case "Telegraphy":
                return "电信电缆";
            case "Television":
                return "电视电缆";
            case "Streetlamp":
                return "路灯电缆";
            default:
                return "未知";
        }
    };
    /**
     * 根据材质编码获取到材质
     * @param {[number]} materialCode [材质编码]
     * @returns {[string]}  [材质类型]
     * @constructor
     */
    var GetMaterialString = function (materialCode) {
        switch (materialCode) {
            // 普通点
            case 0:
                return "铸铁";
            case 1:
                return "球墨铸铁";
            case 2:
                return "砼";
            case 3:
                return "钢";
            case 4:
                return "玻璃钢";
            case 5:
                return "PVC";
            case 6:
                return "陶瓷";
            case 7:
                return "砖";
            case 8:
                return "铜";
            case 9:
                return "光纤";
            case 0xffff:
                return "未知";
            default:
                return materialCode.toString();
        }
    };

    /**
     * 获取点性质代码对应字符串
     * @param {[number]} pointCode [点性质代码]
     */
    var GetPointTypeString = function (pointCode) {
        switch (pointCode) {
            // 普通点
            case 0x0000:
                return "普通点标记";
            case 0x0001:
                return "非普查";
            case 0x0002:
                return "预留口";
            case 0x0003:
                return "直线点";
            case 0x0004:
                return "转折点";
            case 0x0005:
                return "分支点";
            case 0x0006:
                return "变径点";
            case 0x0007:
                return "变深点";
            case 0x0008:
                return "盖堵";
            case 0x0009:
                return "源点";
            case 0x000A:
                return "进水口";
            case 0x000B:
                return "出水口";

            // 连接点
            case 0x1000:
                return "连接点标记";
            case 0x1001:
                return "管帽";
            case 0x1002:
                return "弯头";
            case 0x1003:
                return "三通";
            case 0x1004:
                return "四通";
            case 0x1005:
                return "五通";

            // 功能设备点
            case 0x2000:
                return "设备点标记";
            case 0x2001:
                return "上杆";
            case 0x2002:
                return "接线箱";
            case 0x2003:
                return "化粪池";
            case 0x2004:
                return "阀门";
            case 0x2005:
                return "水表";
            case 0x2006:
                return "消防栓";
            case 0x2007:
                return "凝水缸";
            case 0x2008:
                return "调压箱";
            default:
                return pointCode.toString();
        }
    };

    /**
     * 埋设类型对应字符串
     * @param {[number]} coverCode [埋设类型编码]
     */
    var GetCoverageTypeString = function (coverCode) {
        switch (coverCode) {
            case 0:
                return "直埋";
            case 1:
                return "管埋";
            case 2:
                return "管块";
            case 3:
                return "沟道";
            case 4:
                return "架空";
            default:
                return coverCode.toString();
        }
    };

    /**
     * 根据流向编码得到流向
     * @param {[number]} directionCode [流向编码]
     * @returns {[string]}             [流向]
     */
    var GetFlowDirString = function (directionCode) {
        switch (directionCode) {
            case 1:
                return "起点到终点";
            case 2:
                return "终点到起点";
            case 3:
                return "双向";
            default:
                return "未知";
        }
    };

    /**
     * 根据井编码得到井类型
     * @param {[number]} wellCode   [井编码]
     * @returns {[string]}          [井类型]
     */
    var GetWellTypeString = function (wellCode) {
        switch (wellCode) {
            case 0:
                return "无井";
            case 1:
                return "圆井";
            case 2:
                return "方井";
            case 3:
                return "雨水篦子";
            case 4:
                return "手孔";
            default:
                return wellCode.toString();
        }
    };

    // 字段值对应中文字符串 --- 废弃字段待处理
    var GetFieldValueString = function (nameCode, valueCode) {
        var value = parseInt(valueCode);
        switch (nameCode) {
            // line
            case "US_LTTYPE":
                return FieldValueStringMap.GetCoverageTypeString(value);
            case "US_FLOWDIR":
                return FieldValueStringMap.GetFlowDirString(value);
            case "US_PMATER":
                return FieldValueStringMap.GetMaterialString(value);
            // point
            case "US_PT_TYPE":
                return FieldValueStringMap.GetPointTypeString(value);
            case "US_WELL":
                return FieldValueStringMap.GetWellTypeString(value);

            default:
                return valueCode;
        }
    };
    FieldValueStringMap.GetCoverageTypeString = GetCoverageTypeString;
    FieldValueStringMap.GetWellTypeString = GetWellTypeString;
    FieldValueStringMap.GetFlowDirString = GetFlowDirString;
    FieldValueStringMap.GetMaterialString = GetMaterialString;
    FieldValueStringMap.GetPointTypeString = GetPointTypeString;
    FieldValueStringMap.GetLayerTypeString = GetLayerTypeString;
})();
