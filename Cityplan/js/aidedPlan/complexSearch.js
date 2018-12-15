/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：复合查询
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var earth = top.LayerManagement.earth;
var searchAnalysis = STAMP.searchAnalysis(earth);
var bufPolygon = null;
var elList = null;
var curid = '';
var curpc = '';
var cursc = '';
var pageSize = 20;
var totalNum = 0;
var lastResult = false;//上一次是否加载数据
var clickValue = null;

$(function () {
    init();
});
/**
 * [init 初始化]
 * @return {[type]} [无]
 */
function init() {
    elList = [];
    setGidDivHeight();
    var layer = top.surroundingLayer;
    top.LayerManagement.searchLayers = layer;
    for (var i = 0; i < layer.length; i++) {
        $("#selLayers").append('<option value="' +
            layer[i].id + '" server="' + layer[i].name + '">' +
            layer[i].name + '</option>');
    }
    var column = [];
    column.push({
        field: 'NAME',
        title: '名称',
        width: 100
    });
    column.push({
        field: '__detailBtn__',
        title: '属性',
        width: 100
    });
    //给数据表格设置表头
    $("#dg").datagrid({
        title: '',
        width: '100%',
        singleSelect: true,
        pagination: true,
        columns: [column],
        fitColumns: true,
        onRowContextMenu: function (e, rowIndex, rowData) {
            e.preventDefault();
        },
        onHeaderContextMenu: function (e, field) {
            e.preventDefault();
        },
        onDblClickRow: function (rowIndex, rowData) {
            var rows = $("#dg").datagrid("getRows");
            var layerId = rowData['__attr__'].layerId;
            var key = 'CODE';
            if (!rowData[key] && rowData['__info__']) {
                searchAnalysis.showInfo(rowData['__info__']);
                return;
            }
            var data = searchAnalysis.getGeoDetail(layerId, key, rowData[key]);
            if (data) {
                searchAnalysis.showInfo(data);
            }
        }
    });
    var p = $('#dg').datagrid('getPager');
    p.pagination({
        showPageList: false,
        showRefresh: false,
        pageSize: pageSize,
        beforePageText: '',
        afterPageText: '/{pages}',
        displayMsg: '',
        onSelectPage: function (pageNumber, pageSize) {
            searchAnalysis.showData(curid, curpc, cursc, pageNumber, pageSize);
        }
    });

    resetUi();
    searchAnalysis.clear();
    bindEvents();
}
// 删除旧节点
function resetUi() {
    $("#selFields").empty();
    $("#lstValueRange").empty();
    $('#btnQueryValue').attr('disabled', 'disabled');
    $("#calculate").empty();
}

function bindEvents() {
    document.oncontextmenu = function () {
        event.returnValue = false;
    };
    window.onunload = function () {
        if (parent.earth == null) {
            return;
        }
        searchAnalysis.clear();
    }
    // 获取字段
    $("#btnGetField").click(function(){
        clickValue = null;
        resetUi();
        searchAnalysis.clear();
        var cl = $("#selLayers option:selected");
        if (cl.length < 0) {
            return;
        }
        var id = cl.val();
        if (id) {
            var layerFields = getLayerFields(id);
            if (!layerFields || layerFields.length == 0) {
                return;
            }

            var dataType = earth.LayerManager.GetLayerByGuid(id).DataType;
            var layerNodeName = top.mapMgr.getLayer(dataType.toLowerCase(), 4, 3);
            if (layerNodeName == undefined || layerNodeName == "") {
                // 未配置的图层按POI图层处理
                // 此方法太粗暴，应配置缺省映射，待改进
                layerNodeName = 'POIFieldInfo';
            }
            for (var i = 0; i < layerFields.length; i++) {
                var name = layerFields[i].Name;

                var cn = top.mapMgr.getField(name.toLocaleUpperCase(), layerNodeName, 3, 3, 2);
                if (!top.mapMgr.inited() || cn == undefined) {
                    // 字段映射未成功初始化，用真字段代替显示字段，以向下兼容
                    cn = name.toLocaleUpperCase();
                }
                if (cn != undefined && cn.toLowerCase() != 'objectid' && cn.toLowerCase() != 'shape') {
                    $("#selFields").append('<option value="' +
                        name + '">' + cn + '</option>');
                }
            }
        }
    });
    // 图层变更
    $("#selLayers").change(function () {
        resetUi();
        searchAnalysis.clear();
    });

    /**
     * 获取值域
     * @return {[type]}     [description]
     */
    $("#btnQueryValue").click(function(){
        $("#lstValueRange").empty();
        var lid = $("#selLayers option:selected").val();
        var field = $("#selFields").val();
        $("#loadImg").css("display", "inline-block");
        var vr = searchAnalysis.getValueRange(lid, field);
        $("#loadImg").hide();
        if (!vr) {
            return;
        }
        for (var i = 0; i < vr.length; i++) {
            var v = vr[i];
            $("#lstValueRange").append('<option value="' +
                v + '">' + v + '</option>');
        }
    });

    /**
     * 通过选择字段控制大于小于大于等于小于等于按钮禁用用于否
     */

    function buttonIsEnabled(){
        var id = $("#selLayers option:selected").val();
        var layerFields = getLayerFields(id);//得到当前图层所有的字段
        var field = $("#selFields").val();
        if (!layerFields || layerFields.length == 0) {
            return;
        }

        var dataType = earth.LayerManager.GetLayerByGuid(id).DataType;
        var layerNodeName = top.mapMgr.getLayer(dataType.toLowerCase(), 4, 3);
        for (var i = 0; i < layerFields.length; i++) {
            if(layerFields[i].Name.toLowerCase() == field.toLowerCase()){
                var type = layerFields[i].Type;
                if(type.toLowerCase() == "number"){//如果类型为number才可以进行大于小于否则不可以
                    $("#lt").removeAttr("disabled");
                    $("#ltOrEq").removeAttr("disabled");
                    $("#gt").removeAttr("disabled");
                    $("#gtOrEq").removeAttr("disabled");
                }else{
                    $("#lt").attr("disabled","disabled");
                    $("#ltOrEq").attr("disabled","disabled");
                    $("#gt").attr("disabled","disabled");
                    $("#gtOrEq").attr("disabled","disabled");
                }
                break;
            }
        }

    }

    /**
     * 单击字段列表选项
     * @return {[type]}   [description]
     */
    $("#selFields").click(function () {
        var value = $("#selFields").val();
        if(value == clickValue){
            return;
        }
        clickValue = value;
        $("#lstValueRange").empty();
        $("#btnQueryValue").attr("disabled", false);
        buttonIsEnabled();
    });

    /**
     * 双击字段列表选项
     * @return {[type]}   [description]
     */
    $("#selFields").dblclick(function () {
        var value = $("#selFields").val();
        if(value == null){
            return;
        }
        value = convertField(value, true); //将真字段转换为显示字段
        $("#calculate").append("''" + value + "''");
    });

    $("#eq").click(function () {
        $("#calculate").append(" " + "=" + " ");
    });
    $("#gt").click(function () {
        $("#calculate").append(" " + ">" + " ");
    });
    $("#lt").click(function () {
        $("#calculate").append(" " + "<" + " ");
    });
    $("#uneq").click(function () {
        $("#calculate").append(" " + "!=" + " ");
    });
    $("#gtOrEq").click(function () {
        $("#calculate").append(" " + ">=" + " ");
    });
    $("#ltOrEq").click(function () {
        $("#calculate").append(" " + "<=" + " ");
    });
    $("#And").click(function () {
        $("#calculate").append(" " + "and" + " ");
    });
    $("#Or").click(function () {
        $("#calculate").append(" " + "or" + " ");
    });
    $("#Not").click(function () {
        $("#calculate").append(" " + "not" + " ");
    });

    $("#lstValueRange").dblclick(function () {
        var value = $("#lstValueRange").val();
        if(value == null){
            return;
        }
        $("#calculate").append("'" + value + "'");
    });


    $("#btnQuery").click(function () {
        searchAnalysis.clear();
        var sc = createElement();
        searchData(sc);
    });

    $("#btnPolygonRegion").click(function () {
        searchAnalysis.clear();
        earth.Event.OnCreateGeometry = function (feature, type) {
            var sc = createElement(feature, 'polygon');
            searchData(sc);
        };
        earth.ShapeCreator.CreatePolygon();
        earth.focus();
    });

    $("#btnCircleSelect").click(function () {
        searchAnalysis.clear();
        earth.Event.OnCreateGeometry = function (feature, type) {
            var sc = createElement(feature, 'circle');
            searchData(sc);
        };
        earth.ShapeCreator.CreateCircle();
    });
}
// 获取图层数据
function getLayerFields(id) {
    if (!id) {
        alert('获取图层失败');
        return null;
    }

    var url = top.STAMP_config.server.serviceIP + "/geoserver?service=" + id + '&qt=0&time=' + new Date();
    var dataDoc = null;
    $.ajax({
        type: 'GET',
        dataType: 'text',
        url: url,
        async: false,
        cache: false,
        success: function (data, textStatus, jqXHR) {
            dataDoc = loadXMLStr(data);
            if (!dataDoc) {
                return;
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            dataDoc = null;
        }
    });

    if (!dataDoc || dataDoc.xml == '' || dataDoc.getElementsByTagName('Field').length < 1) {
        alert('未获取到字段信息，可能是网络原因，请稍后再试');
        return null;
    }
    var data = $.xml2json(dataDoc);
    if (!data) {
        alert('未获取到字段信息，可能是网络原因，请稍后再试');
        return null;
    }
    var fields = data.MetaData.Table.Field;
    if (!$.isArray(fields)) {
        fields = [fields];
    }
    return fields;
}
// 过滤器
function filter() {
    var strSQL = $.trim($("#calculate").val());
    if (strSQL == '') {
        return '';
    }
    if (strSQL.length < 2) {
        alert("非法查询语句，请修改！");
        return null;
    }
    var strArr = strSQL.split(" ");
    for(var m=0; m<strArr.length; m++){
        var thisStrArr = strArr[m].split("\'\'");
        if(thisStrArr.length > 1 && thisStrArr[0] && isNaN(thisStrArr[0])){
            alert("非法查询语句，请修改");
            return;
        }
    }
    var strPara = "";
    var key = 0;
    var andor = "and";
    for (var i = 0; i < strSQL.length; i++) {
        if (i + 2 < strSQL.length && (strSQL.substr(i, 2) == "or")) {
            var temp = strSQL.substr(key, i - 1 - key);
            var arrTemp = temp.split(' ');
            if (arrTemp.length != 3) {
                alert("非法查询语句，请修改！");
                return false;
            }
            var temp0 = arrTemp[0];
            if (temp0.length < 4 || !(temp0.substr(0, 2) == "''" && temp0.substr(temp0.length - 2, 2) == "''")) {
                alert("非法查询语句，请修改！");
                return false;
            }
            var temp1 = arrTemp[1];
            if (!(temp1 == "=" || temp1 == ">" ||
                temp1 == "<" || temp1 == ">=" ||
                temp1 == "=<" || temp1 == "!="))
                break;
            var temp2 = arrTemp[2].replace(/\'/g, ""); //去掉引号 否者查询结果有误 2014.4.22
            key = i + 3;
            var aa = "";
            if (temp1 == "=") aa = "equal";
            else if (temp1 == ">") aa = "greater";
            else if (temp1 == "<") aa = "less";
            else if (temp1 == "=<") aa = "lessequal";
            else if (temp1 == ">=") aa = "greaterequal";
            else if (temp1 == "!=") aa = "unequal";

            //将显示字段转换为真字段
            var temp3 = convertField(temp0.substr(2, temp0.length - 4), false);
            strPara += "(" + andor + "," + aa + "," + temp3 + "," + temp2 + ")";

            andor = "or";
        } else if (i + 3 < strSQL.length && strSQL.substr(i, 3) == "and") {
            var temp = strSQL.substr(key, i - 1 - key);
            var arrTemp = temp.split(' ');
            if (arrTemp.length != 3) {
                alert("非法查询语句，请修改！");
                return false;
            }
            var temp0 = arrTemp[0];
            if (temp0.length < 4 || !(temp0.substr(0, 2) == "''" && temp0.substr(temp0.length - 2, 2) == "''")) {
                alert("非法查询语句，请修改！");
                return false;
            }

            var temp1 = arrTemp[1];
            if (!(temp1 == "=" || temp1 == ">" ||
                temp1 == "<" || temp1 == ">=" ||
                temp1 == "=<" || temp1 == "!=")) {
                alert("非法查询语句，请修改！");
                return false;
            }
            var temp2 = arrTemp[2].replace(/\'/g, ""); //去掉引号 否者查询结果有误 2014.4.22
            var a = temp2.substr(0, 2);
            var b = temp2.substr(temp2.length - 2, 2);
            var c = temp2.substr(0, 1);
            var d = temp2.substr(temp2.length - 1, 1);
            key = i + 4;
            var aa = "";
            if (temp1 == "=") aa = "equal";
            else if (temp1 == ">") aa = "greater";
            else if (temp1 == "<") aa = "less";
            else if (temp1 == "=<") aa = "lessequal";
            else if (temp1 == ">=") aa = "greaterequal";
            else if (temp1 == "!=") aa = "unequal";

            //将显示字段转换为真字段
            var temp3 = convertField(temp0.substr(2, temp0.length - 4), false);
            strPara += "(" + andor + "," + aa + "," + temp3 + "," + temp2 + ")";

            andor = "and";
        }
    }
    if (key < strSQL.length) {
        var temp = strSQL.substr(key);
        var arrTemp = temp.split(' ');
        if (arrTemp.length != 3) {
            alert("非法查询语句，请修改！");
            return false;
        }
        var temp0 = arrTemp[0];
        if (temp0.length < 4 || !(temp0.substr(0, 2) == "''" && temp0.substr(temp0.length - 2, 2) == "''")) {
            alert("非法查询语句，请修改！");
            return false;
        }

        var temp1 = arrTemp[1];
        if (!(temp1 == "=" || temp1 == ">" ||
            temp1 == "<" || temp1 == ">=" ||
            temp1 == "<=" || temp1 == "!=")) {
            alert("非法查询语句，请修改！");
            return false;
        }
        var temp2 = arrTemp[2].replace(/\'/g, ""); //去掉引号 否者查询结果有误 2014.4.22
        try {
            var aa = "";
            if (temp1 == "=") aa = "equal";
            else if (temp1 == ">") aa = "greater";
            else if (temp1 == "<") aa = "less";
            else if (temp1 == "<=") aa = "lessequal";
            else if (temp1 == ">=") aa = "greaterequal";
            else if (temp1 == "!=") aa = "unequal";

            //将显示字段转换为真字段
            var temp3 = convertField(temp0.substr(2, temp0.length - 4), false);
            strPara += "(" + andor + "," + aa + "," + temp3 + "," + temp2 + ")";

        } catch (e) {
            alert("非法查询语句，请修改！");
            return false;
        }
    }
    return strPara;
}
// 获取相应数据
function createElement(feature, type) {
    var str = '';
    if (type == 'circle') {
        str = '(3,0,';
        str += feature.Radius + ',';
        str += feature.Longitude + ',' + feature.Latitude;
        str += ')';
    } else if (type == 'polygon') {
        str = '';
        for (var i = 0; i < feature.Count; i++) {
            str += feature.Items(i).X + ',' + feature.Items(i).Y + ',0,';
        }
        str = str.substr(0, str.length - 1);
        str = '(2' + ',' + feature.Count + ',' + str + ')';
    } else if (type == 'all') {
        str = '';
    }
    return str;
}

function convertField(field, field2Caption) {
    //取得图层DataType
    var layerId = $('#selLayers').val();
    var dataType = earth.LayerManager.GetLayerByGuid(layerId).DataType;

    //根据图层DataType取得图层映射表中相应的NodeName
    var layerNodeName = top.mapMgr.getLayer(dataType.toLowerCase(), 4, 3);
    if (layerNodeName == undefined || layerNodeName == "") {
        //未配置的图层按POI图层处理
        layerNodeName = 'POIFieldInfo';
    }

    var txtValue = '';
    if (field2Caption) {
        txtValue = top.mapMgr.getField(field, layerNodeName, 3, 3, 2);
    } else {
        txtValue = top.mapMgr.getField(field, layerNodeName, 3, 2, 3);
    }

    if (txtValue == undefined || txtValue == '') {
        //未配置的字段,不做转换
        txtValue = field;
    }

    return txtValue;
}
// 解析数据
function parseData(data, layerId) {
    var dataDoc = loadXMLStr(data);
    if (!dataDoc || dataDoc.xml == '') {
        alert('未找到符合要求数据！');
        return {
            total: 0,
            rows: []
        };
    }
    var data = $.xml2json(dataDoc);
    if (!data) {
        alert('未找到符合要求数据！');
        return {
            total: 0,
            rows: []
        };
    }

    var geoType = data.Result.geometry;
    var records = data.Result.Record;
    if (records == undefined) {
        alert('未找到符合要求数据！');
        return {
            total: 0,
            rows: []
        };
    }
    if (!$.isArray(records)) {
        records = [records];
    }
    var rows = [];
    var total = parseInt(data.Result.num);
    var dataType = earth.LayerManager.GetLayerByGuid(layerId).DataType;
    for (var i = 0; i < records.length; i++) {
        var obj = {};
        for (var k in records[i]) {
            obj[k] = records[i][k];
        }
        obj['__attr__'] = {
            layerId: layerId,
            dataType: dataType
        };
        obj['__detailBtn__'] = '详情';

        try {
            var d = dataDoc.getElementsByTagName("Record")[i];
            d.setAttribute('dataType', dataType);
            var geoType = dataDoc.getElementsByTagName("Result")[0].getAttribute("geometry");
            var coors = d.getElementsByTagName("Coordinates")[0].text;
            obj['__info__'] = {
                type: geoType,
                coors: coors,
                data: d
            };
        } catch (e) {

        }

        var sfs = ['CODE', 'NAME'];
        for (var j = 0; j < sfs.length; j++) {
            var tf = top.mapMgr.getTrueField(sfs[j], dataType);
            if (obj[sfs[j]] == undefined) {
                obj[sfs[j]] = obj[tf];
            }
        }
        rows.push(obj);
    }

    return {
        total: total,
        rows: rows
    };
}
// 将查询的结果显示出来
function searchData(sc) {
    $("#dgDiv").css("visibility","visible");
    if(lastResult){
        $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        lastResult = false;
    }
    $("#dg").datagrid("loadData", []);
    var id = $("#selLayers").val();
    if (!id) {
        return;
    }
    var pc = filter();
    if (pc === false) {
        return;
    }
    curid = id;
    curpc = pc;
    cursc = sc;

    searchAnalysis.showData(curid, curpc, cursc, 1, pageSize);
}
