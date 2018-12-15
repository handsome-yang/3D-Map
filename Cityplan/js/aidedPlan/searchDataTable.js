/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：属性信息
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var mapMgr;
// 显示具体信息
function postData(infoData) {
    var obj = undefined;
    if (infoData) {
        obj = infoData.node;
        mapMgr = infoData.mapMgr;
    }
    if (obj) {
        var length = obj.childNodes.length;
        for (var i = 0; i < length; i++) {
            if (obj.childNodes[i].nodeName === "SHAPE") {
                continue;
            }
            var nodeText = "";
            var str = toData(obj.childNodes[i].text);
            if (str) {
                nodeText = str;
            } else {
                nodeText = obj.childNodes[i].text;
            }
            if (!isNaN(Number(nodeText))) {
                nodeText = Number(nodeText);
                if (nodeText % 1 === 0) {
                    nodeText = Math.round(nodeText);
                }
                else {
                    nodeText = Number(nodeText).toFixed(2);
                }
            }

            var dataType = obj.getAttribute('dataType');
            var fieldName = obj.childNodes[i].nodeName;
            if (dataType != undefined) {
                fieldName = getCaptionName(fieldName, dataType);
            }

            var html = '<tr><td align="left">' + fieldName + '</td><td align="left">' + nodeText + '</td></tr>';
            $("#dataTable>tbody").append(html);
        }
    }
    //append后需要重新加载一下html元素 保证滚动条能正常显示
    var bodyHtml = $("body").html();
    $("body").html(bodyHtml);
}
/**
 * 将时间戳转换为可读时间
 * @param str 时间戳字符串
 * @returns {*} dataStr
 */
function toData(str) {
    if (/[A-Za-z]/.test(str)) {
        return undefined;
    }

    var data = new Date(str);
    if (isNaN(data.getTime())) {
        return undefined;
    }
    var data = new Date(str);
    var year = data.getFullYear();
    var month = data.getMonth();
    var day = data.getDate();
    var hour = data.getHours();
    var minute = data.getMinutes();
    var second = data.getSeconds();
    var dataStr = "";
    if (year && month && day) {
        dataStr = year + "/" + month + "/" + day + " " + hour + ":" + minute + ":" + second;
    }
    return dataStr;

}

/**
 * 根据真字段获取显示字段
 * @param tField 真实字段
 * @param dataType 属于哪一种,控规或者其他
 * @returns {*}captionName: 标准名称
 */
var getCaptionName = function (tField, dataType) {
    if (dataType == undefined || dataType == '') {
        return tField;
    }
    //根据图层DataType取得图层映射表中相应的NodeName
    var layerNodeName = mapMgr.getLayer(dataType.toLowerCase(), 4, 3);
    if (layerNodeName == undefined || layerNodeName == "") {
        //未配置的图层按POI图层处理
        layerNodeName = 'POIFieldInfo';
    }

    var captionName = mapMgr.getField(tField, layerNodeName, 3, 3, 2);
    if (captionName == undefined || captionName == '') {
        //未配置的字段,不做转换
        captionName = tField;
    }

    return captionName;
}