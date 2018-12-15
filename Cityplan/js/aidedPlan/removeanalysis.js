/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：拆迁分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var earth = top.LayerManagement.earth;
var searchAnalysis = STAMP.searchAnalysis(earth);
var bufPolygon = null;
var curid = '';
var curpc = '';
var cursc = '';
var pageSize = 20;
var elementArr = []; //保存导入或绘制的多边形
var editIndex = undefined;
var area = 0;
var objs = null;
var totalNum = 0;
var calcInfo = null;
var elList = [];
var lastResult = false;

$(function () {
    init();
});
// 初始化数据
function init() {
    var layer = top.removeAnalysisLayer;
    top.LayerManagement.searchLayers = layer;
    for (var i = 0; i < layer.length; i++) {
        $("#parcelLayer").append('<option value="' +
            layer[i].id + '" server="' + layer[i].name + '">' +
            layer[i].name + '</option>');
    }

    var ch = $('#container').layout('panel', 'center').panel('options').height - 66;
    var column = [];
    column.push({
        field: 'CODE',
        title: '建筑编号',
        width: 62
    }, {
        field: 'NAME',
        title: '建筑名称',
        width: 62
    }, {
        field: 'JZXZ',
        title: '建筑性质',
        width: 62
    });
    //给数据表格设置表头
    $("#searchData").datagrid({
        width: '100%',
        height: ch,
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
            var rows = $("#searchData").datagrid("getRows");
            var layerId = rowData['__attr__'].layerId;
            var key = 'CODE';
            var data = searchAnalysis.getGeoDetail(layerId, key, rowData[key]);
            if (data) {
                searchAnalysis.showInfo(data);
            }
        }
    });
    var p = $('#searchData').datagrid('getPager');
    p.pagination({
        showPageList: false,
        showRefresh: false,
        pageSize: pageSize,
        beforePageText: '',
        afterPageText: '/{pages}',
        displayMsg: '',
        onSelectPage: function (pageNumber, pageSize) {
            showData(curid, curpc, cursc, pageNumber, pageSize);
        }
    });

    $("#statGrid").datagrid({
        width: '100%',
        height: ch,
        singleSelect: true,
        pagination: false,
        noWrap: false,
        columns: [
            [{
                field: 'fieldName',
                title: '类型',
                width: 60
            }, {
                field: 'area',
                title: '面积',
                width: 90,
                formatter: function (value, rowData, rowIndex) {
                    return value.toFixed(2);
                }
            }, {
                field: 'cost',
                title: '费用',
                width: 90,
                formatter: function (value, rowData, rowIndex) {
                    return value.toFixed(2);
                }
            }]
        ]
    });

    //新增字段表格
    var columnField = [];
    columnField.push({
        field: "fieldName",
        title: "字段值",
        width: 112
    });
    //设置字段可编辑
    columnField.push({
        field: "fieldPrice",
        title: "单价",
        width: 100,
        editor: {
            type: 'numberbox',
            options: {
                precision: 2,
                min: 0,
                filter: function (e) {
                    alert(typeof e);
                }
            }
        }
    });

    $.extend($.fn.datagrid.methods, {
        editCell: function (jq, param) {
            return jq.each(function () {
                var opts = $('#fieldTable').datagrid('options');
                var fields = $('#fieldTable').datagrid('getColumnFields', true).concat($('#fieldTable').datagrid('getColumnFields'));
                for (var i = 0; i < fields.length; i++) {
                    var col = $('#fieldTable').datagrid('getColumnOption', fields[i]);
                    col.editor1 = col.editor;
                    if (fields[i] != param.field) {
                        col.editor = null;
                    }
                }
                $('#fieldTable').datagrid('beginEdit', param.index);
                for (var i = 0; i < fields.length; i++) {
                    var col = $('#fieldTable').datagrid('getColumnOption', fields[i]);
                    col.editor = col.editor1;
                }
            });
        }
    });

    //给数据表格设置表头
    $("#fieldTable").datagrid({
        width: '100%',
        height: 100,
        singleSelect: true,
        height: 100,
        pagination: false,
        columns: [columnField],
        fitColumns: true,
        onRowContextMenu: function (e, rowIndex, rowData) {
            e.preventDefault();
        },
        onHeaderContextMenu: function (e, field) {
            e.preventDefault();
        },
        onClickCell: onClickCell
    });

    resetUi();
    clear();
    bindEvents();
    $("#parcelLayer").trigger('change');
}

function resetUi() {
    $("#fieldSelect").empty();
    $('#getFieldVal').attr('disabled', 'disabled');
    $("#anaResult input").each(function () {
        this.value = '';
    });
}

function clear() {
    searchAnalysis.clear();
    showBuildings(true);
    $("#chk")[0].checked = false;
    for (var i = 0; i < elementArr.length; i++) {
        earth.DetachObject(elementArr[i]);
    }
    elementArr = [];
}

function bindEvents() {
    document.oncontextmenu = function () {
        event.returnValue = false;
    };
    window.onunload = function () {
        if (earth == null) {
            return;
        }
        clear();
    }
    //选择字段变化时清空值域列表
    $("#fieldSelect").change(function () {
        if(hasClicked){
            $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        }
        $("#fieldTable").datagrid("loadData", []);
        $("#searchData").datagrid("loadData", []);
        $("#statGrid").datagrid("loadData", []);
        searchAnalysis.clear();         //删除气泡和多边形
    });

    $("#parcelLayer").change(function () {
        resetUi();
        clear();
        $("#fieldTable").datagrid("loadData", []);

        var cl = $("#parcelLayer option:selected");
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
                layerNodeName = 'POIFieldInfo';
            }

            for (var i = 0; i < layerFields.length; i++) {
                var name = layerFields[i].Name;
                if (name.toLocaleUpperCase() === "CODE") {
                    txtValue = "建筑编码";
                }
                if (name.toLocaleUpperCase() === "NAME") {
                    txtValue = "建筑名称";
                }
                if (name.toLocaleUpperCase() === "JZXZ") {
                    txtValue = "建筑性质";
                }
                if (name.toLocaleUpperCase() === "JSND") {
                    txtValue = "建筑年代";
                }
                if (name.toLocaleUpperCase() === "ZJZMJ") {
                    txtValue = "总建筑面积";
                }
                if (name.toLocaleUpperCase() === "JZJDMJ") {
                    txtValue = "建筑基底面积";
                }
                if (name.toLocaleUpperCase() === "JZGD") {
                    txtValue = "建筑高度";
                }
                if (name.toLocaleUpperCase() === "JZCS") {
                    txtValue = "建筑层数";
                }
                if (name.toLocaleUpperCase() === "JZXZ"
                    || name.toLocaleUpperCase() === "JSND"
                    || name.toLocaleUpperCase() === "JZGD" || name.toLocaleUpperCase() === "JZCS") {
                    $("#fieldSelect").append('<option value="' +
                        name + '" server="' + name + '">' +
                        txtValue + '</option>');
                }
            }
            if ($('#fieldSelect option').length > 0 && $('#fieldSelect').val()) {
                $('#getFieldVal')[0].disabled = false;
            }
        }
    });
    var hasClicked = false;
    $("#getFieldVal").click(function () {
        if(!hasClicked){
            hasClicked = true;
        }
        $("#fieldTable").datagrid("loadData", []);

        var lid = $("#parcelLayer").val();
        var field = $("#fieldSelect").val();
        var vr = searchAnalysis.getValueRange(lid, field);
        if (!vr) {
            return;
        }
        var tableObj = [];
        for (var i = 0; i < vr.length; i++) {
            tableObj.push({
                "fieldName": vr[i],
                "fieldPrice": 0
            });
        }
        $("#fieldTable").datagrid("loadData", tableObj);
        $($(".datagrid-body")[1]).mCustomScrollbar();
    });

    $("#importShp").click(function () {//导入shp
        endEditing();
        var obj = {};
        obj.earth = earth;
        obj.polygon = "";
        obj.elementArr = elementArr;
        showModalDialog("import_shp.html", obj, "dialogWidth=325px;dialogHeight=170px;status=no");
        if (obj.polygon === "" || obj.polygon === undefined || obj.polygon.Count <= 0) {
            return;
        }
        clear();
        area = getArea(obj.polygon, 'polygon');
        var sc = searchAnalysis.createElement(obj.polygon, 'polygon');
        searchData(sc);
    });

    $("#writerCoord").click(function () {
        endEditing();
        showModelessDialog("editTable.html", {
            earth: earth,
            functionTag: modelessFuntion
        }, "dialogWidth=420px;dialogHeight=320px;status=no");
    });

    $("#btnPolygonSelect").click(function () {
        endEditing();
        clear();
        earth.Event.OnCreateGeometry = function (feature, type) {
            if (feature.Count < 3) {
                alert("至少选择3个点构成多边形");
                earth.ShapeCreator.Clear();
                return;
            }
            area = getArea(feature, 'polygon');
            var sc = searchAnalysis.createElement(feature, 'polygon');
            searchData(sc);
        };
        earth.ShapeCreator.CreatePolygon();
        earth.focus();
    });

    $("#chk").change(function () {
        showBuildings(!$("#chk")[0].checked);
    });
}
// 获取图层文件数据
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

function convertField(field, field2Caption) {
    //取得图层DataType
    var layerId = $('#parcelLayer').val();
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

// 将查询到的结果显示出来
function searchData(sc) {
    $("#resultTabs").css("visibility", "visible");
    $("#checkResult").css("visibility", "visible");
    if (lastResult) {
        $($(".datagrid-body")[3]).mCustomScrollbar("destroy");
    }
    lastResult = false;
    $("#searchData").datagrid("loadData", []);
    var id = $("#parcelLayer").val();
    if (!id) {
        return;
    }
    var pc = '';
    if (pc === false) {
        return;
    }
    curid = id;
    curpc = pc;
    cursc = sc;

    var data = searchAnalysis.getGeoData(curid, curpc, cursc, 0, 100000);
    calcResult(data);

    showData(curid, curpc, cursc, 1, pageSize);
}
/**
 * [showData 将查询结果展示在dg中]
 * @param  {[String]} layerId [图层guid]
 * @param  {[String]} pc      [字段过滤条件]
 * @param  {[String]} sc      [空间过滤条件]
 * @param  {[Number]} pn      [第几页]
 * @param  {[Number]} ps      [每页条数]
 * @return {[type]}           [无]
 */
function showData(layerId, pc, sc, pn, ps) {
    var data = searchAnalysis.getGeoData(layerId, pc, sc, pn - 1, ps);
    if (!data) {
        return;
    }
    data = searchAnalysis.parseData(data, layerId);
    if (pn == 1) {
        totalNum = data.total;
    } else {
        data.total = totalNum;
    }
    if (lastResult) {//上一次加载有数据需要把生成的滚动条销毁掉防止下一次没数据报错
        $($(".datagrid-body")[3]).mCustomScrollbar("destroy");
    }
    $("#searchData").datagrid("loadData", data.rows);
    if (data.total) {//上一次加载有数据需要把生成的滚动条销毁掉防止下一次没数据报错
        $($(".datagrid-body")[3]).mCustomScrollbar();
        lastResult = true;
    } else {
        lastResult = false;
    }
    if (!totalNum) {
        alert("未找到符合要求数据");
    }
    var p = $("#searchData").datagrid('getPager');
    p.pagination({
        total: data.total,
        pageNumber: pn
    });
}
// 创造矢量对象，并将结果显示出来
function modelessFuntion(pointArr) {//导入坐标
    if (pointArr === undefined || pointArr.length <= 0 || pointArr === null) {
        return;
    }
    var vec3s = earth.Factory.CreateVector3s();
    for (var i = 0; i < pointArr.length; i++) {
        var vAltitude = earth.Measure.MeasureTerrainAltitude(pointArr[i].x, pointArr[i].y);
        vec3s.Add(pointArr[i].x, pointArr[i].y, vAltitude);
    }
    clear();
    earth.GlobeObserver.FlytoLookat(vec3s.Items(0).X, vec3s.Items(0).Y, vec3s.Items(0).Z, 0, 60, 0, 100, 2);

    area = getArea(vec3s, 'polygon');
    var sc = searchAnalysis.createElement(vec3s, 'polygon');
    searchData(sc);
}
// 获取范围
function getArea(feature, geoType) {
    try {
        if (geoType == 'polygon') {
            var elementPolygon = earth.Factory.CreateElementPolygon(earth.Factory.CreateGuid(), "");
            elementPolygon.BeginUpdate();
            elementPolygon.SetExteriorRing(feature);
            elementPolygon.EndUpdate();
            area = elementPolygon.area;
            return Math.abs(area);
        } else {
            return 0;
        }
    } catch (e) {
        return 0;
    }
}
// 编辑结束
function endEditing() {
    if (editIndex == undefined) {
        return true
    }
    if ($('#fieldTable').datagrid('validateRow', editIndex)) {
        $('#fieldTable').datagrid('endEdit', editIndex);
        editIndex = undefined;
        return true;
    } else {
        return false;
    }
}

function onClickCell(index, field) {
    if (endEditing()) {
        $('#fieldTable').datagrid('selectRow', index)
            .datagrid('editCell', {
                index: index,
                field: field
            });
        editIndex = index;
    }
}

function calcResult(dataStr) {
    if (!dataStr) {
        alert("未找到符合要求数据！");
        $("#hideDiv").attr("disabled", "disabled");
        return;
    }
    var dataDoc = loadXMLStr(dataStr);
    if (dataDoc.xml === "" || dataDoc.getElementsByTagName("Record").length < 1) {
        alert("未找到符合要求数据！");
        $("#hideDiv").attr("disabled", "disabled");
        return;
    }
    var id = $("#parcelLayer").val();
    if (id) {
        var layerDataType = earth.LayerManager.GetLayerByGuid(id).DataType;
        var buildCount = [];
        var jdmjCount = 0;
        var jzmjCount = 0;
        var zjzmjCount = 0;
        var totalCost = 0;
        if (!calcInfo) {
            calcInfo = [];
        }
        while (calcInfo.length > 0) {
            calcInfo.pop();
        }
        var rows = $('#fieldTable').datagrid('getRows');
        for (var i = 0; i < rows.length; i++) {
            calcInfo.push({
                fieldName: rows[i]['fieldName'],
                area: 0,
                cost: 0
            });
        }

        for (var i = 0; i < dataDoc.getElementsByTagName("Record").length; i++) {
            var node = dataDoc.getElementsByTagName("Record")[i];
            var name = node.getElementsByTagName(top.mapMgr.getTrueField("NAME", layerDataType))[0].text;
            var CODE = node.getElementsByTagName(top.mapMgr.getTrueField("CODE", layerDataType))[0].text;
            var JZXZ = "";
            if (node.getElementsByTagName(top.mapMgr.getTrueField("JZXZ", layerDataType))[0]) {
                JZXZ = node.getElementsByTagName(top.mapMgr.getTrueField("JZXZ", layerDataType))[0].text;
            }
            var JZJDMJ = "";
            if (node.getElementsByTagName(top.mapMgr.getTrueField("JZJDMJ", layerDataType))[0]) {
                JZJDMJ = node.getElementsByTagName(top.mapMgr.getTrueField("JZJDMJ", layerDataType))[0].text;
            }
            var ZJZMJ = "";
            if (node.getElementsByTagName(top.mapMgr.getTrueField("ZJZMJ", layerDataType))[0]) {
                ZJZMJ = node.getElementsByTagName(top.mapMgr.getTrueField("ZJZMJ", layerDataType))[0].text;
            }
            var cs = "";
            if (node.getElementsByTagName(top.mapMgr.getTrueField("JZCS", layerDataType))[0]) {
                cs = node.getElementsByTagName(top.mapMgr.getTrueField("JZCS", layerDataType))[0].text;
            }
            var nd = "";
            if (node.getElementsByTagName(top.mapMgr.getTrueField("JSND", layerDataType))[0]) {
                nd = node.getElementsByTagName(top.mapMgr.getTrueField("JSND", layerDataType))[0].text;
            }
            var gd = "";
            if (node.getElementsByTagName(top.mapMgr.getTrueField("JZGD", layerDataType))[0]) {
                gd = node.getElementsByTagName(top.mapMgr.getTrueField("JZGD", layerDataType))[0].text;
            }
            var rows = $('#fieldTable').datagrid('getRows');
            var fieldName = $("#fieldSelect").val();
            var eachCost = 0;
            if (fieldName == top.mapMgr.getTrueField("JZXZ", layerDataType)) {
                for (var f = 0; f < rows.length; f++) {
                    if (JZXZ == rows[f]["fieldName"]) {
                        eachCost = rows[f]["fieldPrice"];
                        totalCost = totalCost + eachCost * ZJZMJ;
                    }
                }
            } else if (fieldName == top.mapMgr.getTrueField("JSND", layerDataType)) {
                for (var f = 0; f < rows.length; f++) {
                    if (nd == rows[f]["fieldName"]) {
                        eachCost = rows[f]["fieldPrice"];
                        totalCost = totalCost + eachCost * ZJZMJ;
                    }
                }
            } else if (fieldName == top.mapMgr.getTrueField("NAME", layerDataType)) {
                for (var f = 0; f < rows.length; f++) {
                    if (name == rows[f]["fieldName"]) {
                        eachCost = rows[f]["fieldPrice"];
                        totalCost = totalCost + eachCost * ZJZMJ;
                    }
                }
            } else if (fieldName == top.mapMgr.getTrueField("CODE", layerDataType)) {
                for (var f = 0; f < rows.length; f++) {
                    if (CODE == rows[f]["fieldName"]) {
                        eachCost = rows[f]["fieldPrice"];
                        totalCost = totalCost + eachCost * ZJZMJ;
                    }
                }
            } else if (fieldName == top.mapMgr.getTrueField("JZJDMJ", layerDataType)) {
                for (var f = 0; f < rows.length; f++) {
                    if (JZJDMJ == rows[f]["fieldName"]) {
                        eachCost = rows[f]["fieldPrice"];
                        totalCost = totalCost + eachCost * ZJZMJ;
                    }
                }
            } else if (fieldName == top.mapMgr.getTrueField("ZJZMJ", layerDataType)) {
                for (var f = 0; f < rows.length; f++) {
                    if (ZJZMJ == rows[f]["fieldName"]) {
                        eachCost = rows[f]["fieldPrice"];
                        totalCost = totalCost + eachCost * ZJZMJ;
                    }
                }
            } else if (fieldName == top.mapMgr.getTrueField("JZCS", layerDataType)) {
                for (var f = 0; f < rows.length; f++) {
                    if (cs == rows[f]["fieldName"]) {
                        eachCost = rows[f]["fieldPrice"];
                        totalCost = totalCost + eachCost * ZJZMJ;
                    }
                }
            } else if (fieldName == top.mapMgr.getTrueField("JZGD", layerDataType)) {
                for (var f = 0; f < rows.length; f++) {
                    if (gd == rows[f]["fieldName"]) {
                        eachCost = rows[f]["fieldPrice"];
                        totalCost = totalCost + eachCost * ZJZMJ;
                    }
                }
            }
            for (var j = 0; j < calcInfo.length; j++) {
                if (calcInfo[j]['fieldName'] == node.getElementsByTagName(fieldName)[0].text ||
                    calcInfo[j]['fieldName'] == '_all_') {
                    calcInfo[j]['area'] += parseFloat(ZJZMJ);
                    calcInfo[j]['cost'] += parseFloat(eachCost * ZJZMJ);
                }
            }

            var flag = true;
            for (var s = 0; s < buildCount.length; s++) {
                if (CODE === buildCount[s]) {
                    flag = false;
                }
            }
            if (flag) {
                buildCount.push(CODE);
            }
            zjzmjCount += ZJZMJ * 1;
        }
        var price = $("#price").val();
        var areaAna = area.toFixed(2);
        var buildingNum = buildCount.length;
        var removeArea = zjzmjCount.toFixed(2);
        var costOfRemove = totalCost.toFixed(2);
        var numArray = [areaAna, buildingNum, removeArea, costOfRemove];
        var maxNum = Math.max.apply(null, numArray);
        var maxNumLenth = maxNum.toString().length;
        var showObj = [["分析区面积", areaAna, "平方米"], ["拆迁栋数", buildingNum, "栋"], ["拆迁面积", removeArea, "平方米"], ["拆迁费用", costOfRemove, "元"]];
        searchAnalysis.showLeftBalloon(showObj, maxNumLenth);
        $($(".datagrid-body")[5]).mCustomScrollbar("destroy");
        $("#statGrid").datagrid('loadData', calcInfo);
        $($(".datagrid-body")[5]).mCustomScrollbar();
        $("#hideDiv").removeAttr("disabled");
    }
}
// 建筑物显隐
function showBuildings(isShow) {
    if (!isShow) {
        if (elementArr && elementArr.length) {
            var polygon = elementArr[0];
            objs = hideBuilding(polygon, false);
        }
    } else {
        if (objs && objs.length) {
            for (var i = objs.length - 1; i >= 0; i--) {
                objs[i].visibility = true;
            }
        } else {
        }
    }
}

var currentLayerIdList = [];
// 隐藏建筑物
function hideBuilding(elementObj, bShow) {
    var objs = [];
    if (currentLayerIdList && currentLayerIdList.length) {
        for (var i = currentLayerIdList.length - 1; i >= 0; i--) {
            var layerID = currentLayerIdList[i];
            var currentlayer = editLayers[layerID];
            if (currentlayer && elementObj) {
                var rings = elementObj.GetExteriorRing();
                currentlayer.LayerIsPrior = false;
                var eList = currentlayer.ClipByRegion(rings, false);
                if (eList && eList.Count) {
                    var count = eList.Count;
                    for (var j = 0; j < count; j++) {
                        var obj = eList.Items(j);
                        obj.Visibility = bShow;
                        objs.push(obj);
                    }
                }
            }
        }
    }
    return objs;
}