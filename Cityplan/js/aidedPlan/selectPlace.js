/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：选址分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var earth = parent.earth;//球对象
var searchAnalysis = STAMP.searchAnalysis(earth);//公用库
var layerId = null;//当前图层的guid
var layerType = null;//当前对象的图层类型
var pageSize = 20;//datagrid的每页条数
var bufPolygon = null;//图形对象
var elList = [];//查询单个信息绘制的图形
var pc = "";//查询条件
var lastResult = false;
var hasInited = false;//表格是否被初始化过
$(function () {
    init();
    //注册点击以及切换事件
    $("#parcelLayer").change(function () {//图层切换事件
        initParcelType();
    });
    //查询点击事件
    $("#btnQuery").click(function () {
        if(!hasInited){
            initDataGrid();//初始化datagrid
            hasInited = true;
        }
        pc = filter();
        searchAnalysis.showData(layerId, pc, "", 1, pageSize);
    })
    //页面关闭事件
    window.onunload = function () {
        searchAnalysis.clear();//清除掉生成的图形以及详细信息气泡
    }
});
//初始化事件
function init() {
    var checkLayer = initLayers();//初始化图层
    if(!checkLayer){
        $("button").attr("disabled",true);
        return;
    }
    initParcelType();//初始化用地类型
    setGidDivHeight();//设置datagrid的高度
}
//初始化图层select
function initLayers() {
    var layer = top.ctrPlanLayer;//获取到所有的控规图层
    top.LayerManagement.searchLayers = layer;
    if(!layer.length){
        alert("无控规图层");
        return false;
    }
    for (var i = 0; i < layer.length; i++) {
        $("#parcelLayer").append('<option value="' +
            layer[i].id + '" server="' + layer[i].name + '">' +
            layer[i].name + '</option>');
    }
    return true;
}
//初始化列表
function initDataGrid() {
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
            searchAnalysis.showData(layerId, pc, "", pageNumber, pageSize);
        }
    });
}


//初始化用地类型select
function initParcelType() {
    layerId = $("#parcelLayer option:selected").val();
    var layer = earth.LayerManager.GetLayerByGUID(layerId);
    layerType = layer.DataType;
    var parcelTypeField = top.mapMgr.getTrueField("YDXZ", layerType);//字段映射
    var vr = searchAnalysis.getValueRange(layerId, parcelTypeField);//获取字段值域
    if (!vr) {
        return;
    }
    for (var i = 0; i < vr.length; i++) {
        var v = vr[i];
        $("#parcelType").append('<option value="' +
            v + '">' + v + '</option>');
    }
}
//返回:服务需要的比较字符串
//根据界面条件获取条件字符串
//返回条件字符串
function filter() {
    var filterStr = ""
    var parcelType = $("#parcelType").val();//用地类型
    var parcelTypeField = top.mapMgr.getTrueField("YDXZ", layerType);
    var parcelArea = $("#parcelArea").val();//用地面积
    var parcelAreaField = top.mapMgr.getTrueField("YDMJ", layerType);
    var buildingDensity = $("#buildingDensity").val();//建筑密度
    var buildingDensityField = top.mapMgr.getTrueField("JZMD", layerType);
    var volumeRatio = $("#volumeRatio").val();//容积率
    var volumeRatioField = top.mapMgr.getTrueField("RJL", layerType);

    if (parcelType) {
        filterStr += "(and,equal," + parcelTypeField + "," + parcelType + ")";
    }
    if (parcelArea) {
        var areaSelect = $("#areaSelect").val();
        var str = getFilter(areaSelect);
        filterStr += str + parcelAreaField + "," + parcelArea + ")";
    }
    if (buildingDensity) {
        var densitySelect = $("#densitySelect").val();
        var str1 = getFilter(densitySelect);
        filterStr += str1 + buildingDensityField + "," + buildingDensity + ")";
    }
    if (volumeRatio) {
        var volumeSelect = $("#volumeSelect").val();
        var str1 = getFilter(volumeSelect);
        filterStr += str1 + volumeRatioField + "," + volumeRatio + ")";
    }
    return filterStr;

}
//根据选择的大于等于和小于等于获取应该使用什么过滤条件字符串
//selectcalue:0,大于等于；1,小于等于
function getFilter(selectValue) {
    var filterStr;
    switch (selectValue) {
        case "0" :
            filterStr = "(and,greaterequal,";
            break;
        case "1" :
            filterStr = "(and,lessequal,";
            break;
    }
    return filterStr;
}

