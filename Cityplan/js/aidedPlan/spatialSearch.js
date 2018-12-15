/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：空间查询
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
var lastResult = false;//上一次是否有数据

$(function() {
    init();
});
// 初始化图层Select
function init() {
    elList = [];

    var layer = top.surroundingLayer;
    top.LayerManagement.searchLayers = layer;
    for (var i = 0; i < layer.length; i++) {
        $("#parcelLayer").append('<option value="' +
            layer[i].id + '" server="' + layer[i].name + '">' +
            layer[i].name + '</option>');
    }
    setGidDivHeight();
    searchAnalysis.clear();
    bindEvents();
    initGrid();
    $("#parcelLayer").trigger('change');
}
// 初始化表格
function initGrid() {
    var column = [];
    column.push({
        field: 'NAME',
        title: '名称',
        width: 105
    });
    column.push({
        field: '__detailBtn__',
        title: '属性',
        width: 100
    });
    //给数据表格设置表头
    $("#dg").datagrid({
        title:'',
        width:'100%',
        singleSelect: true,
        pagination: true,
        columns: [column],
        fitColumns: true,
        onRowContextMenu: function(e, rowIndex, rowData) {
            e.preventDefault();
        },
        onHeaderContextMenu: function(e, field) {
            e.preventDefault();
        },
        onDblClickRow: function(rowIndex, rowData) {
            var rows = $("#dg").datagrid("getRows");
            var layerId = rowData['__attr__'].layerId;
            var key = 'CODE';
            if(!rowData[key] && rowData['__info__']){
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
        pageSize:pageSize,
        beforePageText: '',
        afterPageText: '/{pages}',
        displayMsg: '',
        onSelectPage: function(pageNumber, pageSize) {
            searchAnalysis.showData(curid, curpc, cursc, pageNumber, pageSize);
        }
    });
}

function bindEvents() {
    document.oncontextmenu = function() {
        event.returnValue = false;
    };
    window.onunload = function() {
        if (parent.earth == null) {
            return;
        }
        searchAnalysis.clear();
    }

    $("#parcelLayer").change(function() {
        searchAnalysis.clear();
    });

    $("#btnQuery").click(function() {
        searchAnalysis.clear();
        var sc = createElement();
        searchData(sc);
    });
    $("#btnPolygonSelect").click(function() {
        searchAnalysis.clear();
        earth.Event.OnCreateGeometry = function(feature, type) {
            var sc = createElement(feature, 'polygon');
            searchData(sc);
        };
        earth.ShapeCreator.CreatePolygon();
        earth.focus();
    });
    $("#btnCircleSelect").click(function() {
        searchAnalysis.clear();
        earth.Event.OnCreateGeometry = function(feature, type) {
            var sc = createElement(feature, 'circle');
            searchData(sc);
        };
        earth.ShapeCreator.CreateCircle();
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
        success: function(data, textStatus, jqXHR) {
            dataDoc = loadXMLStr(data);
            if (!dataDoc) {
                return;
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
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
// 获取相应区域数据
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

// 将搜索的结果显示出来
function searchData(sc) {
    $("#dgDiv").css("visibility","visible");
    if(lastResult){
        $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        lastResult = false;
    }
    $("#dg").datagrid("loadData", []);
    var id = $("#parcelLayer").val();
    if (!id) {
        return;
    }
    var pc = '';
    if (typeof pc != 'string') {
        return;
    }
    curid = id;
    curpc = pc;
    cursc = sc;

    searchAnalysis.showData(curid, curpc, cursc, 1, pageSize);
}