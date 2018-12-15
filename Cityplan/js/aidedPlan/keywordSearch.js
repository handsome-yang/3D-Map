/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：关键字查询
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var earth = top.LayerManagement.earth;
var searchAnalysis = STAMP.searchAnalysis(earth)
var bufPolygon = null;
var elList = null;
var curid = '';
var curpc = '';
var cursc = '';
var pageSize = 20;
var totalNum = 0;
var lastResult = false;//上一次是否有加载数据

$(function() {
    init();
});
// 初始化数据
function init() {
    elList = [];
    setGidDivHeight();
    var layer = top.surroundingLayer;
    top.LayerManagement.searchLayers = layer;
    for (var i = 0; i < layer.length; i++) {
        $("#parcelLayer").append('<option value="' +
            layer[i].id + '" server="' + layer[i].name + '">' +
            layer[i].name + '</option>');
    }
    var column = [];
    column.push({
        field: 'NAME',
        title: '名称',
        width: 110
    });
    column.push({
        field: '__detailBtn__',
        title: '属性',
        width: 110
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

    resetUi();
    searchAnalysis.clear();
    bindEvents();
    $("#parcelLayer").trigger('change');
}

function resetUi() {
    $("#searchkey").empty();
    $("#searchChk").empty();
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
        resetUi();
        searchAnalysis.clear();

        var id = $("#parcelLayer").val();
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
                    $("#searchkey").append('<option value="' +
                        name + '" server="' + name + '">' +
                        cn + '</option>');
                }
            }
        }
    });

    $("#schData").click(function(){
        searchAnalysis.clear();
        searchData();
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
// 过滤器
function filter(){
    var str = $('#searchChk').val();
    if(containSpecial(str)){
        alert("不能有特殊字符！");
        return null;
    }
    try{
        if(str == ''){
            return str;
        }
        var tf = $('#searchkey').val();
        str = '(and,like,'+tf+','+str+')';
        return str;
    }catch(e){
        return null;
    }
}
// 将查询到的结果显示出来
function searchData() {
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
    var pc = filter();
    if (typeof pc != 'string') {
        return;
    }
    curid = id;
    curpc = pc;
    cursc = '';

    searchAnalysis.showData(curid, curpc, cursc, 1, pageSize);
}

function containSpecial( s ){
    var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\?)(\)]+/);
    return ( containSpecial.test(s) );
}