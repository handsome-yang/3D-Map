/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月7日
 * 描    述：快速定位js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var pageSize = 20; //每页显示条数
var pageCount = 1;//总页数
var numCount = 0;//数据条数
var lastResult = false;//上一次查询是否有结果
$(function () {
    earth = parent.LayerManagement.earth;
    var projectId = parent.SYSTEMPARAMS.project;
    var seachType = "";//定位方式
    var divHeight = $("#tablediv").height() - $(".cardTitle").height();
    $("#dg").height(divHeight);
    // 定位方式change事件
    $("#selTypes").change(function () {
        seachType = $("#selTypes").val();
    });
    $("#selTypes").trigger("change");
    //判断服务是否支持
    var enableServices = function () {
        var obj = parent.areaTable;//index.js 全局变量
        if ($.inArray("road", obj) == -1) {
            $("#selTypes option[value='road']").remove();
        }
        if ($.inArray("canton", obj) == -1) {
            $("#selTypes option[value='canton3']").remove();
        }
        if ($.inArray("company", obj) == -1) {
            $("#selTypes option[value='Company']").remove();
        }
        if ($("#selTypes").val() == null) {
            $("#selTypes").attr("disabled", "disabled");
        }
    };
    enableServices();
    var rightClick = function (event) {
        event.returnValue = false;
    };
    //datagrid双击事件
    var dbclick = function (rowIndex, rowData) {
        var id = rowData.listNum;
        if (data.coordinatesArr.length < 0) return;
        var service = $("#selTypes").val();
        QueryObject.QuerySelectedArea(service, projectId, rowData.name)
    };

    /**
     * 没有结果要把mscrollbar给销毁掉
     */
    function loadNoData() {
        divloaded();
        $("#dg").datagrid({
            pagination: false
        });
        lastResult = false;
        if (lastResult) {
            $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        }
        lastResult = false;
        $('#dg').datagrid('loadData', {total: 0, rows: []});
        return;
    }

    /**
     * 构造datagrid
     * @param data 要加载的数据
     */
    var initDataGrid = function (data) {
        if (data.length < 1) {
            alert("无该图层分析数据");
            if (lastResult) {
                $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
            }
            lastResult = false;
            $("#dg").datagrid({
                pagination: false
            });
            $('#dg').datagrid('loadData', {total: 0, rows: []});
            return;
        }
        var pageNum = Math.ceil(data.length / pageSize);
        $("#dg").datagrid({
            pageSize: 20,
            singleSelect: true,
            pagination: true,
            columns: [
                [{
                    field: 'Index',
                    title: '序号',
                    width: 60,
                    align: 'center',
                    formatter: function (value, rowData, rowIndex) {
                        return rowIndex + 1;
                    }
                }, {
                    field: 'name',
                    title: '名称',
                    width: 60,
                    align: 'center'
                }]
            ],
            fitColumns: true,
            singleSelect: true, //单行选择模式
            onDblClickRow: dbclick,
            onRowContextMenu: rightClick,
            nowrap: false
        });
        var firstData = data.slice(0, pageSize);
        var dataLoad = {"total": data.length, "rows": firstData};
        if (lastResult) {
            $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        }
        $('#dg').datagrid('loadData', dataLoad);
        $($(".datagrid-body")[1]).mCustomScrollbar();
        lastResult = true
        var pager = $('#dg').datagrid('getPager');
        pager.pagination({
            showPageList: false,
            showRefresh: false,
            beforePageText: "",
            afterPageText: "" + pageNum + "页",
            displayMsg: '',
            onSelectPage: function (pageNum, pageSize) {//上一页下一页点击事件
                if (pageNum == 1) {
                    var thisStart = 0;
                } else {
                    var thisStart = (pageNum - 1) * 20 - 1;
                }
                var thisEnd = thisStart + pageSize;

                var thisData = data.slice(thisStart, thisEnd);
                if (lastResult) {
                    $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
                }
                var thisDataLoad = {"total": data.length, "rows": thisData};
                $('#dg').datagrid('loadData', thisDataLoad);
                lastResult = true;
                $($(".datagrid-body")[1]).mCustomScrollbar();
            }
        });

    }

    //查询
    var data = null;
    $("#btnQuery").click(function () {
        $("#result>tbody").empty();
        divload("tablediv");
        if (lastResult) {
            $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        }
        lastResult = false;
        $("#result").datagrid("loadData", []);
        var keyVal = $("#txtKeyword").val();
        var service = chkSearchKey();
        showResult(service, keyVal, projectId, 0, pageSize);
    });
    //查询关键字判断
    var chkSearchKey = function () {
        var key = "";
        if (seachType === "poi") {   //poi
            key = "Poi";
        } else if (seachType === "road") {//道路
            key = "road";
        } else if (seachType === "Company") { //单位
            key = "company";
        } else if (seachType === "canton3") { //行政区
            key = "canton3";
        }
        return key;
    };
    //分页控件引用
    var pagePagination = function () {
        $("#page").pagination({
            total: numCount,//总的记录数
            pageSize: pageSize,//每页显示的大小。
            showPageList: false,
            showRefresh: false,
            displayMsg: "",
            beforePageText: "  ",
            afterPageText: "" + pageCount + "页"
        });
    }
    /**
     * 查询结果并显示结果
     * @param {[string]}  service   [要查询的类型]
     * @param {[string]}  keyVal    [查询的关键字]
     * @param {[string]} projectId  [工程guid]
     * @param {[string]} numStart        [从第几页开始]
     * @param {[string]} numCount        [每页条数]
     * @param w
     */
    var showResult = function (service, keyVal, projectId, numStart, numCount) {
        var dataGridArr = {
            totleCount: "",
            dataArr: [],
            coordinatesArr: []
        };
        var mQueryString;
        if (!keyVal) {//查询所有
            mQueryString = params.ip + "/dataquery?service=" + service + "&qt=17&fd=NAME&project=" + projectId;
        } else {//模糊查询
            mQueryString = params.ip + "/dataquery?service=" + service + "&qt=17&fd=NAME&project=" + projectId + "&pc=(and,like,NAME," + keyVal + ")";
        }
        mQueryString += "&pg=" + 0 + "," + 100000;
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                var json = $.xml2json(xmlDoc);
                if (json == null) {
                    alert("无查询数据!");
                    loadNoData();
                    return null;
                }
                var records = json.Result.Record;
                if (!records) {
                    alert("无查询数据");
                    loadNoData();
                    return null;
                }
                dataGridArr.totleCount = json.Result.num;
                var pointType;
                if (json.Result.num <= 0) {
                    alert("无查询数据");
                    loadNoData();
                    return null;
                } else if (json.Result.num == 1) {
                    var coordinatesType = records.SHAPE.Polygon;
                    pointType = "Polygon";
                    if (!coordinatesType) {
                        coordinatesType = records.SHAPE.Polyline;
                        pointType = "Polyline";
                    }
                    if (!coordinatesType) {
                        coordinatesType = records.SHAPE.Point;
                        pointType = "Point";
                    }
                    var coordinates = coordinatesType.Coordinates;

                    if ((numCount && numCount >= 0) && (numStart >= 0)) {
                        dataGridArr.dataArr.push({"listNum": numStart, "name": records.NAME});
                        dataGridArr.coordinatesArr[numStart] = coordinates;
                    }
                } else {
                    var nIndex = 0;
                    for (var i = 0; i < records.length; i++) {
                        var record = records[i];
                        var coordinatesType = record.SHAPE.Polygon;
                        pointType = "Polygon";
                        if (!coordinatesType) {
                            coordinatesType = record.SHAPE.Polyline;
                            pointType = "Polyline";
                        }
                        if (!coordinatesType) {
                            coordinatesType = record.SHAPE.Point;
                            pointType = "Point";
                        }
                        var coordinates = coordinatesType.Coordinates;
                        if (record.NAME) {
                            if ((numCount && numCount >= 0) && (numStart >= 0)) {
                                dataGridArr.dataArr.push({
                                    "listNum": numStart * numCount + nIndex + 1,
                                    "name": records[i].NAME
                                });
                                dataGridArr.coordinatesArr[numStart * numCount + nIndex + 1] = coordinates;
                                nIndex++;
                            }
                        }
                    }
                }
                data = dataGridArr;
                divloaded();
                initDataGrid(dataGridArr.dataArr);
            }
        }
        earth.DatabaseManager.GetXml(mQueryString);
    }
    $(window).unload(function () {
        if (earth.GlobeObserver) {
            QueryObject.clearBuffer();
        }
    });
});