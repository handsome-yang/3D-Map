/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：限高分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var earth = top.LayerManagement.earth;
var searchAnalysis = STAMP.searchAnalysis(earth);
var bufPolygon = null;
var pageSize = 20;
var elementArr = []; //保存导入或绘制的多边形
var volumes = [];
var buildings = null;
var modelessDialog = null;
var elList = [];
var lastResult = false;//上一次是否有查询结果
var hasInited = false;//datagrid是否被初始化过

$(function () {
    init();
});

// 初始化数据
function init() {
    var layer = top.ctrPlanLayer;
    top.LayerManagement.searchLayers = layer;
    for (var i = 0; i < layer.length; i++) {
        $("#parcelLayer").append('<option value="' +
            layer[i].id + '" server="' + layer[i].name + '">' +
            layer[i].name + '</option>');
    }
    var layer1 = top.indicatorAccountingLayer;
    for (var s = 0; s < layer1.length; s++) {
        $("#buildLayer").append('<option value="' +
            layer1[s].id + '" server="' + layer1[s].name + '">' +
            layer1[s].name + '</option>');
    }
    setGidDivHeight();
    clear();
    bindEvents();
}
// 初始化表格
function initDataGrid() {
    var dataTableHeight = $("#centerDiv").height() - $(".cardTitle").height();
    var column = [];
    column.push({
        field: 'CODE',
        title: '建筑编号',
        width: 61,
        align: 'center'
    }, {
        field: 'NAME',
        title: '建筑名称',
        width: 61,
        align: 'center'
    }, {
        field: 'JZGD',
        title: '建筑高度',
        width: 61,
        align: 'center'
    }, {
        field: '_XG_',
        title: '限高',
        width: 61,
        align: 'center'
    });
    //给数据表格设置表头
    $("#dg").datagrid({
        title: '',
        width: '100%',
        height: dataTableHeight,
        singleSelect: true,
        pagination: true,
        columns: [column],
        fitColumns: true,
        nowrap: false,
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
            showData(pageNumber, pageSize);
        }
    });
}
/**
 * [showData 将查询结果展示在dg中]
 * @param  {[String]} pn [第几页]
 * @param  {[String]} ps [每页条数]
 * @return {[type]}      [无]
 */
function showData(pn, ps) {
    if (!buildings || buildings.length == 0) {
        $("#dg").datagrid("loadData", []);
        var p = $("#dg").datagrid('getPager');
        p.pagination({
            total: 0,
            pageNumber: 1
        });
        return;
    }

    var si = (pn - 1) * ps;
    var ei = pn * ps - 1;
    if (ei > buildings.length - 1) {
        ei = buildings.length - 1;
    }

    var rows = [];
    for (var i = si; i < ei; i++) {
        rows.push(buildings[i]);
    }
    if (lastResult) {
        $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
    }
    $("#dg").datagrid("loadData", rows);
    $($(".datagrid-body")[1]).mCustomScrollbar();
    lastResult = true;
    var p = $("#dg").datagrid('getPager');
    p.pagination({
        total: buildings.length,
        pageNumber: pn
    });
}

// 移除对象
function clear() {
    searchAnalysis.clear();
    for (var i = 0; i < elementArr.length; i++) {
        earth.DetachObject(elementArr[i]);
    }
    elementArr = [];
    for (var i = 0; i < volumes.length; i++) {
        earth.DetachObject(volumes[i]);
    }
    volumes = [];
}


function bindEvents() {
    document.oncontextmenu = function () {
        event.returnValue = false;
    };
    window.onunload = function () {
        if (earth == null) {
            return;
        }
        modelessDialog_Close();
        clear();
    }

    $("#importShp").click(function () {
        var obj = {};
        obj.earth = earth;
        obj.polygon = "";
        obj.elementArr = elementArr;
        obj.userdataTemp = top.userdataTemp;
        showModalDialog("import_shp.html", obj, "dialogWidth=310px;dialogHeight=145px;status=no");
        if (obj.polygon === "" || obj.polygon === undefined || obj.polygon.Count <= 0) {
            return;
        }
        clear();
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
        clear();
        earth.Event.OnCreateGeometry = function (feature, type) {
            if (feature.Count < 3) {
                alert("至少选择3个点构成多边形");
                earth.ShapeCreator.Clear();
                return;
            }
            var sc = searchAnalysis.createElement(feature, 'polygon');
            searchData(sc);
        };
        earth.ShapeCreator.CreatePolygon();
        earth.focus();
    });
}

function modelessDialog_Close() {
    if (modelessDialog && !modelessDialog.closed) {
        modelessDialog.close();
        modelessDialog = null;
    }
}

// 将查询到的结果显示出来
function searchData(sc) {
    divload("centerdiv");
    if (!hasInited) {
        initDataGrid();
        hasInited = true;
    }
    earth.ShapeCreator.Clear();
    buildings = [];
    var parcelId = $("#parcelLayer").val();
    var buildingId = $("#buildLayer").val();
    var parceDataType = earth.LayerManager.GetLayerByGuid(parcelId).DataType;
    var buildDataTypE = earth.LayerManager.GetLayerByGuid(buildingId).DataType;
    if (!parcelId || !buildingId) {
        return;
    }
    var data = searchAnalysis.getGeoData(parcelId, '', sc, 0, 100000, 17);
    if (!data) {
        alert('未找到符合要求数据,可能是网络原因,请稍后再试');
        return;
    }
    data = searchAnalysis.parseData(data, parcelId);
    if (!data || data.rows.length == 0) {
        alert('未找到符合要求数据,可能是网络原因,请稍后再试');
        return;
    }
    var data2 = searchAnalysis.getGeoData(buildingId, '', sc, 0, 100000, 16);
    if (!data2) {
        alert('未找到符合要求数据,可能是网络原因,请稍后再试');
        return;
    }
    data2 = searchAnalysis.parseData(data2, buildingId);
    if (!data2 || data2.rows.length == 0) {
        alert('未找到符合要求数据,可能是网络原因,请稍后再试');
        return;
    }

    // 由查询范围获得的building
    // 用于根据各控规面做二次查询时过滤掉查询范围外的building
    var key = 'OBJECTID';
    var sb = {};
    for (var i = 0; i < data2.rows.length; i++) {
        var oid = data2.rows[i][key];
        sb[oid] = oid;
    }

    function isExist(src, key, value) {
        try {
            for (var i = 0; i < src.length; i++) {
                if (src[key] == value) {
                    return true;
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    var total = 0;
    for (var i = 0; i < data.rows.length; i++) {
        try {
            var heightLimit = data.rows[i][top.mapMgr.getTrueField('JZXG', parceDataType)];
            var eachShape = data.rows[i].SHAPE.Polygon.Coordinates;

            //添加控规盒
            var shpCooords = eachShape.split(",");
            var v3s = earth.Factory.CreateVector3s();
            for (var j = 0; j < shpCooords.length; j += 3) {
                var v3 = earth.Factory.CreateVector3();
                v3.X = shpCooords[j];
                v3.Y = shpCooords[j + 1];
                v3.Z = shpCooords[j + 2];
                v3s.AddVector(v3);
            }
            var volume = earth.Factory.CreateElementVolume(earth.Factory.CreateGuid(), "");
            volume.BeginUpdate();
            var newPolygon = earth.Factory.CreatePolygon();
            newPolygon.AddRing(v3s);
            //根据控规面中心取中心高程作为控规面
            var centerPoint = newPolygon.GetCenterPoint();
            if (centerPoint) {
                var cHeight = earth.Measure.MeasureTerrainAltitude(centerPoint.X, centerPoint.Y);
                v3s = newPolygon.GetRingAt(0);
                for (var j = 0; j < v3s.Count; j++) {
                    v3s.SetAt(j, v3s.Items(j).X, v3s.Items(j).Y, v3s.Items(j).Z + cHeight);
                }
            }
            volume.SetPolygon(1, newPolygon);
            volume.height = Number(heightLimit);
            volume.FillColor = 0x96FFFFFF;
            volume.Editable = false;
            volume.selectable = false;
            volume.EndUpdate();
            earth.AttachObject(volume);
            volumes.push(volume);

            var count = eachShape.split(',').length / 3;
            var spatialPara = "(2,";
            spatialPara += count + ",";
            spatialPara += eachShape + ")";

            var data3 = searchAnalysis.getGeoData(buildingId, '', spatialPara, 0, 100000);
            data3 = searchAnalysis.parseData(data3, buildingId);
            if (!data3 || data3.rows.length == 0) {
                continue;
            }
            for (var j = 0; j < data3.rows.length; j++) {
                var res = data3.rows[j];
                var oid = res[key];
                if (!sb[oid]) {
                    // 不在查询范围内
                    continue;
                }
                if (isExist(buildings, key, oid)) {
                    // 已压入结果集的building
                    continue;
                }
                res['_XG_'] = parseFloat(heightLimit).toFixed(2);
                buildings.push(res);
            }
        } catch (e) {
            continue;
        }
    }
    showData(1, pageSize);
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
    clear();


    earth.GlobeObserver.FlytoLookat(vec3s.Items(0).X, vec3s.Items(0).Y, vec3s.Items(0).Z, 0, 60, 0, 100, 2);

    var sc = searchAnalysis.createElement(vec3s, 'polygon');
    searchData(sc);
}