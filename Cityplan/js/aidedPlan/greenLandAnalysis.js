/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：绿地分析
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
var area = 0;
var totalNum = 0;
var modelessDialog = null;
var elList = [];
var lastResult = false;//上一次是否有数据
var elementPolygon = null;//导入shp或者怎么样生成的
var hasInited = false;//datagrid是否被初始化过

$(function () {
    init();
});
// 初始化数据
function init() {
    var layer = top.greenbeltAnalysisLayer;
    top.LayerManagement.searchLayers = layer;
    for (var i = 0; i < layer.length; i++) {
        $("#parcelLayer").append('<option value="' +
            layer[i].id + '" server="' + layer[i].name + '">' +
            layer[i].name + '</option>');
    }
    setGidDivHeight();
    resetUi();
    searchAnalysis.clear();
    bindEvents();
    $("#parcelLayer").trigger('change');
}
// 初始化表格
function initGrid() {
    var column = [];
    column.push({
        field: 'CODE',
        title: '绿地编号',
        width: 65
    }, {
        field: 'NAME',
        title: '绿地名称',
        width: 65
    }, {
        field: 'ZMJ',
        title: '绿地面积',
        width: 65,
        formatter: function (value, rowData, rowIndex) {
            var greenArea = Number(value);
            if(!isNaN(greenArea)){
                greenArea = greenArea.toFixed(2);
            }

            return greenArea;
        }
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
}

function resetUi() {
    $("#anaResult input").each(function () {
        this.value = '';
    });
}

function bindEvents() {
    document.oncontextmenu = function () {
        event.returnValue = false;
    };
    window.onunload = function () {
        if (parent.earth == null) {
            return;
        }
        modelessDialog_Close();
        searchAnalysis.clear();
    }

    $("#importShp").click(function () {
        var obj = {};
        obj.earth = earth;
        obj.polygon = "";
        obj.elementArr = elementArr;
        showModalDialog("import_shp.html", obj, "dialogWidth=325px;dialogHeight=170px;status=no");
        if (obj.polygon === "" || obj.polygon === undefined || obj.polygon.Count <= 0) {
            return;
        }
        searchAnalysis.clear();
        area = getArea(obj.polygon, 'polygon');
        var sc = searchAnalysis.createElement(obj.polygon, 'polygon');
        searchData(sc);
    });

    $("#writerCoord").click(function () {
        if (!modelessDialog || modelessDialog.closed) {
            modelessDialog = showModelessDialog("editTable.html", {
                    earth: earth,
                    functionTag: modelessFuntion
                },
                "dialogWidth=420px;dialogHeight=320px;status=no");
        }
    });

    $("#btnPolygonSelect").click(function () {
        searchAnalysis.clear();
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
}

function filter() {
    return '';
}

// 将查询到的结果显示出来
function searchData(sc) {
    if(!hasInited){
        initGrid();
        hasInited = true;
    }
    if (lastResult) {
        $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        lastResult = false;
    }
    $("#dg").datagrid("loadData", []);
    var id = $("#parcelLayer").val();
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

    var data = searchAnalysis.getGeoData(curid, curpc, cursc, 0, 100000);
    calcResult(data);

    searchAnalysis.showData(curid, curpc, cursc, 1, pageSize);
}

function modelessDialog_Close() {
    if (modelessDialog && !modelessDialog.closed) {
        modelessDialog.close();
        modelessDialog = null;
    }
}
// 创造矢量对象，并将结果显示出来
function modelessFuntion(pointArr) {
    if (pointArr === undefined || pointArr.length <= 0 || pointArr === null) {
        return;
    }
    var vec3s = earth.Factory.CreateVector3s();
    for (var i = 0; i < pointArr.length; i++) {
        var vAltitude = earth.Measure.MeasureTerrainAltitude(pointArr[i].x, pointArr[i].y);
        vec3s.Add(pointArr[i].x, pointArr[i].y, vAltitude);
    }
    searchAnalysis.clear();
    earth.GlobeObserver.FlytoLookat(vec3s.Items(0).X, vec3s.Items(0).Y, vec3s.Items(0).Z, 0, 60, 0, 100, 2);

    area = getArea(vec3s, 'polygon');
    var sc = searchAnalysis.createElement(vec3s, 'polygon');
    searchData(sc);
}
// 计算结果
function calcResult(dataStr) {
    if (!dataStr) {
        return;
    }
    var dataDoc = loadXMLStr(dataStr);
    if (dataDoc.xml === "" || dataDoc.getElementsByTagName("Record").length < 1) {
        return;
    }

    var id = $("#parcelLayer").val();
    if (id) {
        var dataType = earth.LayerManager.GetLayerByGuid(id).DataType;
        var zjzmjCount = 0;
        for (var i = 0; i < dataDoc.getElementsByTagName("Record").length; i++) {
            var node = dataDoc.getElementsByTagName("Record")[i];
            var name = node.getElementsByTagName(top.mapMgr.getTrueField('NAME', dataType))[0].text;
            var CODE = node.getElementsByTagName(top.mapMgr.getTrueField('CODE', dataType))[0].text;
            var zmj = parseFloat(node.getElementsByTagName(top.mapMgr.getTrueField('ZMJ', dataType))[0].text).toFixed(2);
            zjzmjCount += zmj * 1;
        }
        var rate = ((zjzmjCount / area) * 100).toFixed(2);
        var showArea = area.toFixed(2);
        var showGreenArea = zjzmjCount.toFixed(2);
        var numArray = [showArea, showGreenArea, rate];
        var maxNum = Math.max.apply(null, numArray);
        var maxNumLenth = maxNum.toString().length;
        var showObj = [["分析区面积",showArea,"平方米"],["绿化面积",showGreenArea,"平方米"],["容积率",rate,""]];
        searchAnalysis.showLeftBalloon(showObj, maxNumLenth);
    }
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