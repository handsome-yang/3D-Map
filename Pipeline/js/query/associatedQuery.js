/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：关联查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var res;
var recordType;
var recordT;
var recordUSID;
var bShow = false;
var lastResult = false;//上一次查询是否有结果
var query = null;
$(function () {
    ptLineRecs = [];
    setGidDivHeight();
    earth = top.LayerManagement.earth;
    query = Query.PageHelper(earth);
    var spaceParams = null;
    var projectId = top.SYSTEMPARAMS.project;
    StatisticsMgr.initPipelineSelectList(projectId, $("#selLayers"));//初始化管线图层列表
    /**
     * 详细信息点击事件
     */
    $("#detailData").click(function () {
        bShow = $(this).attr("checked") == "checked";
        if (!bShow) {
            top.LayerManagement.clearHtmlBalloons();
        } else {
            query.setShow(bShow);
        }
    });
    /**
     * 设置按钮禁用与否
     */
    var btnDisabled = function () {
        var line = $("#PointTypeValue option:selected").val();
        var point = $("#LineTypeValue option:selected").val();
        if (line == undefined || point == undefined) {
            $("#btnAllQuery").attr("disabled", true);
            $("#btnCircleSelect").attr("disabled", true);
            $("#btnPolygonQuery").attr("disabled", true);
        } else {
            $("#btnAllQuery").attr("disabled", false);
            $("#btnCircleSelect").attr("disabled", false);
            $("#btnPolygonQuery").attr("disabled", false);
        }
    };
    /**
     * 图层切换事件
     */
    $("#selLayers").change(function () {
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        $("#selPointFields").empty();
        var layer = earth.LayerManager.GetLayerByGUID(guid);
        var dataType = "point";
        var mQueryString = layer.GISServer + "dataquery?service=" + guid + "&qt=0&dt=" + dataType;
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                queryPointFields(xmlStr);
            }
            $("#selLineFields").empty();
            var layer = earth.LayerManager.GetLayerByGUID(guid);
            var dataType = "line";
            var mQueryString = layer.GISServer + "dataquery?service=" + guid + "&qt=0&dt=" + dataType;
            earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                    var xmlStr = pRes.AttributeName;
                    queryLineFields(xmlStr);
                }
                $("#PointTypeValue").empty();
                $("#LineTypeValue").empty();
                btnDisabled();
            }
            earth.DatabaseManager.GetXml(mQueryString);
        }
        earth.DatabaseManager.GetXml(mQueryString);
    }).trigger("change");
    /**
     * 点字段切换事件
     */
    $("#selPointFields").change(function () {
        $("#PointTypeValue").empty();
        btnDisabled();
    });
    /**
     * 线字段切换事件
     */
    $("#selLineFields").change(function () {
        $("#LineTypeValue").empty();
        btnDisabled();
    });
    /**
     * 线字段获取值域点击事件
     */
    $("#btnQueryLineVal").click(function () {
        var vv = $("#selLineFields option:selected");
        var fieldName = vv.val();
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        $("#LineTypeValue").empty();
        var layer = earth.LayerManager.GetLayerByGUID(guid);
        var dataType = "line";
        var mQueryString = layer.GISServer + "dataquery?service=" + guid + "&qt=256&fd=" + fieldName + "&dt=" + dataType;
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                queryFieldLineValues(xmlStr, guid);
                btnDisabled();
            }
        };
        earth.DatabaseManager.GetXml(mQueryString);

    });
    /**
     * 点获取值域点击事件
     */
    $("#btnQueryPointVal").click(function () {
        var vv = $("#selPointFields option:selected");
        var fieldName = vv.val();
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        $("#PointTypeValue").empty();
        var layer = earth.LayerManager.GetLayerByGUID(guid);
        var dataType = "point";
        var mQueryString = layer.GISServer + "dataquery?service=" + guid + "&qt=256&fd=" + fieldName + "&dt=" + dataType;
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                queryFieldPointValues(xmlStr, guid);
                btnDisabled();
            }
        };
        earth.DatabaseManager.GetXml(mQueryString);
    });
    /**
     * 执行查询
     * @param pFeat 查询空间条件
     */
    var createQuery = function (pFeat) {
        divload("tablediv");
        recordT = new ActiveXObject("Scripting.Dictionary");
        recordType = new ActiveXObject("Scripting.Dictionary");
        recordUSID = new ActiveXObject("Scripting.Dictionary");

        var ptChecked = document.getElementById("point").checked;
        var lineChecked = document.getElementById("line").checked;
        var queryTableType = [0, 1];

        //线类型参数
        var lineTypeValue = $("#LineTypeValue").val();
        var linePara = "";
        linePara += "(and,equal,";
        linePara += $("#selLineFields").val();
        linePara += ",'";
        linePara += lineTypeValue;
        linePara += "')";

        //点类型参数
        var pointTypeValue = $("#PointTypeValue").val();
        var pointPara = "";
        pointPara += "(and,equal,";
        pointPara += $("#selPointFields").val();
        pointPara += ",'";
        pointPara += pointTypeValue;
        pointPara += "')";

        //获取图层的guid与name
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        var name = vv.text();
        if (ptChecked) {
            queryLineHandler(guid, pFeat, linePara, 16, [1], ptChecked);
            queryPointHandler(guid, pFeat, pointPara, 16, [0], ptChecked);
        } else {
            queryPointHandler(guid, pFeat, pointPara, 16, [0], ptChecked);
            queryLineHandler(guid, pFeat, linePara, 16, [1], ptChecked);
        }
        //根据过滤后的records 数据显示在datagrid表格中
        var header = ["US_KEY", "US_FEATURE"];
        var aliasHeader = ["编号", "类型"];
        var column = [];
        var originWidth = 240 / aliasHeader.length;
        for (var k = 0; k < header.length; k++) {
            column.push({field: header[k], title: aliasHeader[k], width: originWidth});
        }
        $('#dg').datagrid({
            columns: [column],
            pageSize: 20,
            pagination: true
        });
        initDataGrid(header, aliasHeader, rec, guid);
        divloaded();
        if (!lastResult) {
            alert("无查询结果");
        }
        $("#detailData").attr("disabled", false);
        $("#importExcelBtn").attr("disabled", false);
    };
    var importRecordCount = 0;
    var importPages = 0;
    var recordIndexDic = new ActiveXObject("Scripting.Dictionary");
    /**
     * 构成datagrid结果
     * @param header        显示的结果表头的标准字段
     * @param aliasHeader   显示结果表头的中文名称
     * @param pageRecord    显示的结果记录集合
     * @param guid          查询图层的Guid
     */
    var initDataGrid = function (header, aliasHeader, pageRecord, guid) {
        if (pageRecord === undefined || pageRecord.length === 0) {
            var importExcelBtn = $("#importExcelBtn");
            if (importExcelBtn) {
                importExcelBtn.attr("disabled", true);
            }
            if (lastResult) {
                $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
            }
            $("#dg").datagrid({
                pagination: false
            });
            $('#dg').datagrid('loadData', {total: 0, rows: []});
            return;
        }
        //解析record
        var values = getFieldValue(header, pageRecord);
        var pages = Math.ceil(values.length / 20);
        importPages = pages;
        //加载数据
        var ptChecked = document.getElementById("point").checked;
        var standardKey;
        if (ptChecked) {
            standardKey = top.getName("US_KEY", 0, true);
        } else {
            standardKey = top.getName("US_KEY", 1, true);
        }

        for (var i = 0; i < pages; i++) {//页数循环
            var resInd = [];
            for (var j = 0; j < values.length; j++) {
                if (j >= i * 20 && j < (i + 1) * 20) {//每一页里的20条记录循环
                    var item = values[j];
                    for (var key in item) {
                        if (key === standardKey || key === standardKey) {
                            item["US_KEY"] = item[key];
                        }
                    }
                    resInd.push(item);
                    recordIndexDic.item(i) = resInd;
                }
            }
        }
        //datagrid双击事件
        $('#dg').datagrid({
            onDblClickRow: function (rowIndex, rowData) {
                var vv = $("#selLayers option:selected");
                var layerName = vv.text();
                var options = $('#dg').datagrid('getPager').data("pagination").options;
                var curr = options.pageNumber;
                var red = recordUSID.item(rowData);

                var type = recordT.item(red);
                var key;
                var USID;
                if (type == "管线") {
                    var us_key = top.getName("US_KEY", 1, true);
                    key = red[us_key];
                } else {
                    var us_key = top.getName("US_KEY", 0, true);
                    key = red[us_key];
                }
                var layerID = guid;

                if (bShow) {
                    //显示气泡  word-break: break-all;word-wrap: break-word; 内容自动换行
                    if (top.SYSTEMPARAMS.balloonAlpha > 0) {
                        htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:310px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
                    } else {
                        htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:255px;height:275px;font-family:Microsoft Yahei;border:1px solid #ccc;margin-top:15px;margin-bottom:15px"><table style="font-size:16px; color: black">';
                    }
                    var mid;
                    if (type != "管线") {
                        query.initPointValue(layerID, red, layerName, type, guid, key, htmlStr);
                    } else {
                        mid = query.initLineValue(layerID, red, layerName);
                        htmlStr = htmlStr + mid + '</table></div>';
                        //高亮
                        query.highlightObject(layerID, type, USID, key, htmlStr);
                    }
                } else {
                    query.highlightObject(layerID, type, USID, key);
                }
            }
        });
        importRecordCount = values.length;
        var data = {"total": values.length, "rows": recordIndexDic.item(0)};
        if (lastResult) {
            $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        }
        $('#dg').datagrid('loadData', data);
        $($(".datagrid-body")[1]).mCustomScrollbar();
        lastResult = true;

        //分页属性设置
        var pager = $('#dg').datagrid('getPager');
        pager.pagination({
            showPageList: false,
            showRefresh: false,
            beforePageText: "",
            afterPageText: "" + pages + "页",
            displayMsg: '',
            onSelectPage: function (pageNum, pageSize) {
                var data = {"total": values.length, "rows": recordIndexDic.item(pageNum - 1)};
                $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
                $('#dg').datagrid('loadData', data);
                $($(".datagrid-body")[1]).mCustomScrollbar();
                lastResult = true;
            }
        });
    };
    /**
     * 根据服务返回的记录和需要显示的字段得到需要显示的记录
     * @param header        需要显示的字段的标准名称
     * @param pageRecord    服务返回的所有的记录
     * @returns {Array}     需要显示出来的所有记录
     */
    var getFieldValue = function (header, pageRecord) {
        var values = [];
        var ptChecked = document.getElementById("point").checked;
        var resType;
        if (ptChecked) {
            resType = "管点";
        } else {
            resType = "管线";
        }
        if (pageRecord && pageRecord.length > 0) {
            //遍历每一个Record
            for (var i = 0; i < pageRecord.length; i++) {
                var record = pageRecord[i];
                if (record) {
                    var row = {};
                    for (var j = 0; j < header.length; j++) {
                        var key = header[j];
                        if (key === undefined) {
                            continue;
                        }
                        var keyUpper;
                        keyUpper = key.toLocaleUpperCase();
                        if (key != "US_FEATURE" && key != "layerName") {
                            if (resType === "管点") {
                                key = top.getName(key, 0, true);
                            } else {
                                key = top.getName(key, 1, true);
                            }
                        }

                        if (key && (record[key] != undefined || record[keyUpper] != undefined)) {
                            row[key] = record[key] ? record[key] : record[keyUpper];
                            if (key === "US_LTTYPE") {//埋设方式
                                row[key] = FieldValueStringMap.GetFieldValueString("US_LTTYPE", record.US_LTTYPE);//埋设类型
                            }
                            if (key === "US_PDIAM") {//管线管径
                                if (Number(record.US_PDIAM) > 0) {
                                    row[key] = Number(record.US_PDIAM).toFixed(2);
                                } else {
                                    row[key] = record.US_PWIDTH + "X" + record.US_PHEIGHT;
                                }
                            }
                            if (key === "US_PWIDTH") {  //US_PDIAM并不是所有的管线都有这个地段
                                row[key] = record.US_PWIDTH + "X" + record.US_PHEIGHT;
                            }
                            if (keyUpper === "US_EDEEP") {
                                row[key] = Number(record.US_EDEEP).toFixed(2);
                            }
                            if (keyUpper === "US_SDEEP") {
                                row[key] = Number(record.US_SDEEP).toFixed(2);
                            }
                            if (keyUpper === "US_PT_ALT") {
                                row[key] = Number(record.US_PT_ALT).toFixed(2);
                            }
                            if (keyUpper === "US_BD_TIME") {
                                row[key] = record.US_BD_TIME > 0 ? parseFloat(record.US_BD_TIME).toFixed(2) : "";
                            }
                            //这里增加对管点或者管线的判断
                            if (resType === "管点") {
                                if (key != "US_FEATURE") {
                                    var keyCode = row[key];
                                    row[key] = keyCode;
                                } else {//当传入的是us_feature时
                                    var keyCode = record["US_ATTACHM"];
                                    var keyAtt = "AttachmentCode";
                                    if (keyCode === undefined || keyCode === "" || keyCode === "0" || keyCode === null || keyCode === "null") {
                                        keyCode = record["US_PT_TYPE"];
                                        keyAtt = "CPointCodes";
                                        if (keyCode === undefined || keyCode === "") {
                                            row[key] = "管点";
                                            continue;
                                        }
                                    }
                                    row[key] = keyCode;
                                }
                            } else {
                                var keyCode = row[key];
                                row[key] = keyCode;
                            }
                        } else {
                            if (key === "US_FEATURE") {
                                row[key] = recordType.item(record);
                                if (resType === "管点") {
                                    var usType = top.getName("US_PT_TYPE", 0, true);
                                    var usAttach = top.getName("US_ATTACHMENT", 0, true);
                                    var usWell = top.getName("US_WELL", 0, true);
                                    //TODO:需要根据井类型做更加合理的判断处理......
                                    if (record[usType]) {
                                        row[key] = record[usType];
                                    } else if (record[usAttach]) {
                                        row[key] = record[usAttach];
                                    } else if (record[usWell]) {
                                        row[key] = record[usWell];
                                    }
                                } else {
                                    row[key] = "管线";
                                }
                            } else if (keyUpper === "LAYERNAME") {
                                row[key] = layerName;
                            } else {
                                if (record[key] != undefined) {
                                    row[key] = record[key];
                                }
                            }
                        }
                    }
                    recordUSID.item(row) = record;
                    values.push(row);
                }
            }
        }
        return values;
    };
    /**
     * 查询管点数据
     * @param layerID           要查询的管线图层guid
     * @param feature           查询空间条件
     * @param filter            查询属性条件字符串
     * @param queryType         查询类型
     * @param queryTableType    查询表类型
     * @param ptChecked         是否是查询管点
     * @returns {null}
     */
    var queryPointHandler = function (layerID, feature, filter, queryType, queryTableType, ptChecked) {
        var result = getResult(layerID, feature, filter, queryType, queryTableType);
        if (ptChecked) {//点查询 该处进入点查询
            var recordNum = result.RecordCount;
            var pageNum = Math.ceil(recordNum / 100);
            rec = [];
            for (var i = 0; i < pageNum; i++) {
                var bPage = result.gotoPage(i);
                if ("error" == bPage) {//服务端返回错误!
                    return;
                }
                var json = $.xml2json(bPage);
                var records = json.Result.Record;
                if (!records) {
                    return;
                }
                var type = json.Result.geometry;
                var displayType = type === "point" ? "管点" : "管线";
                var usKey;
                if (displayType == "管点") {
                    usKey = top.getName("US_KEY", 0, true);
                } else {
                    usKey = top.getName("US_KEY", 1, true);
                }
                var keys = recordType.Keys().toArray();//将obj对象的键值转换成数组
                if(!records){
                    return null;
                }
                if (!records.length) {
                    records = [records]
                }
                for (var j = 0; j < records.length; j++) {
                    var usres = records[j];
                    for (var p = 0; p < keys.length; p++) {
                        var keyStr = keys[p];
                        if (keyStr.indexOf(usres[usKey]) != -1) {
                            if (rec.length > 0) {
                                if (!isContain(rec, usres)) {
                                    rec.push(usres);
                                    recordT.item(usres) = displayType;
                                }
                            } else {
                                rec.push(usres);
                                recordT.item(usres) = displayType;
                            }
                        }
                    }
                }
            }
        } else {//线查询 该处进入线查询
            res = getRecords(result, "point");
        }
    };
    /**
     * 查询管线
     * @param layerID           要查询的管线图层的GUid
     * @param feature           查询的空间条件
     * @param filter            查询的属性条件
     * @param queryType         查询类型
     * @param queryTableType    查询表类型
     * @param ptChecked         查询管线是否被选中
     */
    var queryLineHandler = function (layerID, feature, filter, queryType, queryTableType, ptChecked) {
        var result = getResult(layerID, feature, filter, queryType, queryTableType);
        if (ptChecked) {
            res = getRecords(result, "line");
        } else {
            //"查询管线"选中情况下
            var recordNum = result.RecordCount;
            var pageNum = Math.ceil(recordNum / 100);
            //返回数据
            rec = [];
            for (var i = 0; i < pageNum; i++) {
                var bPage = result.gotoPage(i);
                var json = $.xml2json(bPage);
                var records = json.Result.Record;
                if (!records) {
                    return null;
                }
                var type = json.Result.geometry;
                var usKey = top.getName("US_KEY", 1, true);
                var keys = recordType.Keys().toArray();
                if (!records) {
                    return;
                }
                if (!records.length) {
                    records = [records]
                }
                for (var j = 0; j < records.length; j++) {
                    //管线遍历
                    var usres = records[j];
                    //管点编号遍历
                    for (var p = 0; p < keys.length; p++) {
                        var keyStr = keys[p];
                        //根据管线的起点编号与终点编号来判断
                        var startKey = top.getName("US_SPT_KEY", 1, true);
                        var endKey = top.getName("US_EPT_KEY", 1, true);
                        var startKeyVal = usres[startKey];
                        var endKeyVal = usres[endKey];
                        //如果管点编号等于管线对应的管点编号之一 则保留该管线
                        if (keyStr == startKeyVal || keyStr == endKeyVal) {
                            if (rec.length > 0) {
                                if (!isContain(rec, usres)) {
                                    rec.push(usres);
                                    recordT.item(usres) = "管线";
                                }
                            } else {
                                rec.push(usres);
                                recordT.item(usres) = "管线";
                            }
                        }
                    }
                }
            }
        }
    };
    /**
     * 判断obj是否存在在array里面
     * @param array     数组
     * @param obj       对象
     * @returns {boolean}   存在：true,不存在：false
     */
    var isContain = function (array, obj) {
        var bol = false;
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i] != obj) {
                continue;
            } else {
                bol = true;
                break;
            }
        }
        return bol;
    };
    /**
     * 管线查询数据库
     * @param layerID           要查询的管线图层的Guid
     * @param feature           查询的空间条件对象,isevector3s
     * @param filter            查询的属性条件字符串
     * @param queryType         查询类型:1,空间;16,属性;17,空间+属性
     * @param queryTableType    查询表类型:0,点表;1,线表
     * @returns {object}        查询结果isesearchresult
     */
    var getResult = function (layerID, feature, filter, queryType, queryTableType) {
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var subLayer = null;
        for (var i = 0, len = layer.GetChildCount(); i < len; i++) {
            subLayer = layer.GetChildAt(i);
            if (subLayer.LayerType == "Container") {
                break;
            }
        }
        if (subLayer == null) {
            return;
        }

        var param = subLayer.QueryParameter;
        if (param == null) {
            return null;
        }
        param.ClearCompoundCondition();
        param.ClearSpatialFilter();
        param.ClearRanges();
        param.Filter = "";
        if (filter != null) {
            param.Filter = filter;
        }
        if (feature != null) {
            param.SetSpatialFilter(feature);
        }
        if (queryTableType != null) {
            param.QueryTableType = queryTableType;//[0] [0,1]
        }
        param.QueryType = queryType;
        param.PageRecordCount = pageRecCount;
        var result = subLayer.SearchFromGISServer();
        return result;
    };
    var pageRecCount = 100;//设置每一页返回的记录条数
    /**
     * 根据查询结果得到需要显示的结果
     * @param result    查询结果
     * @param type      类型,"point","line"
     * @returns {*}
     */
    var getRecords = function (result, type) {
        var rec;
        if (result) {
            var usKey;
            var startKey;
            var endKey;
            if (type === "line") {
                //先进行管线查询 最后查询管点的时候 要先保存管线的起点编号与终点编号
                startKey = top.getName("US_SPT_KEY", 1, true);
                endKey = top.getName("US_EPT_KEY", 1, true);
                var recordNum = result.RecordCount;
                var pageNum = Math.ceil(recordNum / 100);
                rec = [];
                for (var i = 0; i < pageNum; i++) {
                    var bPage = result.gotoPage(i);
                    var json = $.xml2json(bPage);
                    var records = json.Result.Record;
                    if (!records) {
                        return;
                    }
                    if (records.length && records.length > 0) {
                        for (var j = 0; j < records.length; j++) {
                            var usres = records[j];
                            var startKeyVal = usres[startKey];
                            var endKeyVal = usres[endKey];
                            recordType.item(startKeyVal) = usres;
                            recordType.item(endKeyVal) = usres;
                        }
                    } else {
                        var startKeyVal = records[startKey];
                        var endKeyVal = records[endKey];
                        recordType.item(startKeyVal) = records;
                        recordType.item(endKeyVal) = records;
                    }
                }
            } else if (type === "point") {
                //先进行管点查询 最后进行管线查询 只需要在内层循环里 获取管线的起点(终点)编号比对即可
                usKey = top.getName("US_KEY", 0, true);
                var recordNum = result.RecordCount;
                var pageNum = Math.ceil(recordNum / 100);
                rec = [];
                for (var i = 0; i < pageNum; i++) {
                    var bPage = result.gotoPage(i);
                    if (bPage == "error") {//服务端返回错误!
                        return;
                    }
                    var json = $.xml2json(bPage);
                    var records = json.Result.Record;
                    if (!records) {
                        return;
                    }
                    if (records.length && records.length > 0) {
                        for (var j = 0; j < records.length; j++) {
                            var usres = records[j];
                            recordType.item(usres[usKey]) = usres;
                        }
                    } else {

                        recordType.add(records[usKey], records);
                    }
                }
            }

        }
        return rec;
    };
    /**
     * 全部查询
     */
    $("#btnAllQuery").click(function () {
        //先清理气泡
        top.LayerManagement.clearHtmlBalloons();
        ptLineRecs = [];
        earth.ShapeCreator.Clear();
        createQuery(null);
    });
    /**
     * 多边形查询
     */
    $("#btnPolygonQuery").click(function () {
        //先清理气泡
        top.LayerManagement.clearHtmlBalloons();
        ptLineRecs = [];
        earth.Event.OnCreateGeometry = onCreatePolygon;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreatePolygon();
    });
    /**
     * 画多边形回调函数
     * @param pFeat
     * @param geoType
     */
    var onCreatePolygon = function (pFeat, geoType) {
        createQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    /**
     * 圆域查询
     */
    $("#btnCircleSelect").click(function () {
        //先清理气泡
        top.LayerManagement.clearHtmlBalloons();
        ptLineRecs = [];
        earth.Event.OnCreateGeometry = onCreateCircle;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreateCircle();
    });
    /**
     * 圆域查询回调函数
     * @param pFeat
     * @param geoType
     */
    var onCreateCircle = function (pFeat, geoType) {
        createQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        $("#importResult").empty();
        for (var i = 0; i < importPages; i++) {
            var dataArr = recordIndexDic.item(i);
            for (var j = 0; j < dataArr.length; j++) {
                $("#importResult").append("<tr><td>" + dataArr[j]["US_KEY"] + "</td><td>" + dataArr[j]["US_FEATURE"] + "</td></tr>");
            }
        }

        var tabObj = $("#importResult")[0];
        var columns = ["编号", "类型"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    $(window).unload(function () {
        if (earth.ShapeCreator != null) {
            earth.ShapeCreator.Clear();
        }
        StatisticsMgr.detachShere();
    });
});
/**
 * 点字段
 * @param queryURL 服务返回的xml字符串
 */
var queryPointFields = function (queryURL) {
    var xmlDoc = top.loadXMLStr(queryURL);
    var json = $.xml2json(xmlDoc);
    if (json == null || !json.MetaData) {
        return;
    }
    var field = json.MetaData.Table.Field;
    for (var i = 0; field && field.length && i < field.length; i++) {
        //数据库表字段
        var strName = field[i].Name;
        var standName = top.getStandardName(strName, 0, true);
        var ptType = top.getName("US_PT_TYPE", 0, true);
        if (standName == "US_WELL_ID" || standName == "US_WELL" || standName == "US_KEY") continue;
        var captionName = top.getStandardName(strName, 0, false);
        if (captionName != "" && captionName != undefined) {
            var selected = (strName == ptType ? "selected" : "");
            $("#selPointFields").append('<option value="' +
                strName + '" ' + selected + '>' +
                captionName + '</option>');
        }
    }
};
/**
 * 线字段
 * @param queryURL
 */
var queryLineFields = function (queryURL) {
    var xmlDoc = top.loadXMLStr(queryURL);
    var json = $.xml2json(xmlDoc);
    if (json == null || !json.MetaData) {
        return;
    }
    var field = json.MetaData.Table.Field;
    for (var i = 0; field && field.length && i < field.length; i++) {
        //数据库表字段
        var strName = field[i].Name;
        var standName = top.getStandardName(strName, 1, true);
        if (standName == "US_ID" || strName == "SHAPE" || standName == "US_KEY" || standName == "US_SPT_KEY" || standName == "US_EPT_KEY") continue;
        var captionName = top.getStandardName(strName, 1, false);
        if (captionName != "" && captionName != undefined) {
            var selected = (strName == "US_LTTYPE" ? "selected" : "");
            $("#selLineFields").append('<option value="' +
                strName + '" ' + selected + '>' +
                captionName + '</option>');
        }
    }
};
/**
 * 发送异步请求，查询选择字段
 * @param queryURL
 */
var queryFieldPointValues = function (queryURL, layerId, layerCode) {
    var xmlDoc = top.loadXMLStr(queryURL);
    var json = $.xml2json(xmlDoc);
    if (json == null || !json.ValueRangeResult) {
        return;
    }
    var nameCode = $("#selPointFields").val();
    var dataType = ($("#selLayers").get(0).selectedIndex % 2) == 0 ? "line" : "point";
    if (dataType === "line") {
        nameCode = top.getStandardName(nameCode, 1, true);
    } else {
        nameCode = top.getStandardName(nameCode, 0, true);
    }
    var nameType = "";
    if (nameCode == "US_ATTACHMENT") {
        nameType = "Attachment";
    } else if (nameCode == "US_PT_TYPE") {
        nameType = "PointType";
    } else if (nameCode == "US_PMATER") {
        nameType = "MaterialType";
    } else if (nameCode == "US_LTTYPE") {
        nameType = "LayoutType";
    } else if (nameCode == "US_LTYPE") {
        nameType = "LineType";
    } else if (nameCode == "US_PRESSUR") {
        nameType = "Pressure";
    } else if (nameCode == "US_STATUS") {
        nameType = "StatusType";
    } else if (nameCode == "US_OWNER") {
        nameType = "Ownership";
    }
    var values = json.ValueRangeResult.ValueRange.Value;
    if (typeof(values) == "string") {
        if (nameCode == "US_BD_TIME") {
            values = values.substring(0, 10);
            values = values.replace(/-/g, "/");
        }
        $("#PointTypeValue").append('<option value="' +
            values + '" title="' + values + '">' +
            values + '</option>');
    } else if (typeof(values) == "object") {
        for (var i = 0; i < values.length; i++) {
            if (nameCode == "US_BD_TIME") {
                values[i] = values[i].substring(0, 10);
                values[i] = values[i].replace(/-/g, "/");
            }
            $("#PointTypeValue").append('<option value="' +
                values[i] + '" title="' + values[i] + '">' +
                top.getCaptionByCustomValue(layerCode, nameType, values[i]) + '</option>');
        }
    }
    $("#PointTypeValue").get(0).selectedIndex = 0;
};
/**
 * 发送异步请求，查询选择字段
 * @param queryURL
 */
var queryFieldLineValues = function (queryURL, layerId, layerCode) {
    var xmlDoc = top.loadXMLStr(queryURL);
    var json = $.xml2json(xmlDoc);
    if (json == null || !json.ValueRangeResult) {
        return;
    }
    var nameCode = $("#selLineFields").val();
    nameCode = top.getStandardName(nameCode, 1, true);
    var nameType = "";
    if (nameCode == "US_ATTACHMENT") {
        nameType = "Attachment";
    } else if (nameCode == "US_PT_TYPE") {
        nameType = "PointType";
    } else if (nameCode == "US_PMATER") {
        nameType = "MaterialType";
    } else if (nameCode == "US_LTTYPE") {
        nameType = "LayoutType";
    } else if (nameCode == "US_LTYPE") {
        nameType = "LineType";
    } else if (nameCode == "US_PRESSUR") {
        nameType = "Pressure";
    } else if (nameCode == "US_STATUS") {
        nameType = "StatusType";
    } else if (nameCode == "US_OWNER") {
        nameType = "Ownership";
    }
    var values = json.ValueRangeResult.ValueRange.Value;
    if (typeof(values) == "string") {
        if (!values) {
            alert("无查询数据");
            return;
        }
        if (nameCode == "US_BD_TIME") {
            values = values.substring(0, 10);
            values = values.replace(/-/g, "/");
        }
        $("#LineTypeValue").append('<option value="' +
            values + '" title="' + values + '">' +
            top.getCaptionByCustomValue(layerCode, nameType, values) + '</option>');
    } else if (typeof(values) == "object") {
        if (nameCode == "US_SIZE") {
            var numArr = [];
            for (var i = 0; i < values.length; i++) {
                var numObj = {};
                if (values[i].indexOf('X') > -1) {
                    numObj.NUM = Number(values[i].substring(0, values[i].indexOf('X')));
                    numObj.ONUM = values[i];
                } else {
                    numObj.NUM = Number(values[i]);
                    numObj.ONUM = values[i];
                }
                numArr.push(numObj);
            }
            numArr.sort(function (a, b) {
                return (a.NUM > b.NUM) || (a.NUM == b.NUM && a.ONUM > b.ONUM) ? 1 : -1;
            });
            for (var i = 0; i < values.length; i++) {
                if (!numArr[i].ONUM) {
                    continue;
                }
                $("#LineTypeValue").append('<option value="' +
                    numArr[i].ONUM + '" title="' + numArr[i].ONUM + '">' +
                    numArr[i].ONUM + '</option>');
            }
        } else {
            values.sort();
            for (var i = 0; i < values.length; i++) {
                //对于数字单独处理一下
                if (Number(values[i]) == 0 || !isNaN(Number(values[i]))) {
                    var eachNum;
                    if (nameCode == "US_ROAD" || nameCode == "US_LTTYPE" || nameCode == "US_LTYPE" || nameCode == "US_BD_TIME") {
                        eachNum = values[i];
                    } else {
                        eachNum = (Number(values[i]) == 0) ? 0 : Number(values[i]);
                    }
                    if (!eachNum && parseInt(eachNum) != 0) {
                        continue;
                    }
                    $("#LineTypeValue").append('<option value="' +
                        eachNum + '" title="' + eachNum + '">' +
                        top.getCaptionByCustomValue(layerCode, nameType, eachNum) + '</option>');
                } else {
                    if (!values[i]) {
                        continue;
                    }
                    if (nameCode == "US_BD_TIME") {
                        values[i] = values[i].substring(0, 10);
                        values[i] = values[i].replace(/-/g, "/");
                    }
                    $("#LineTypeValue").append('<option value="' +
                        values[i] + '" title="' + values[i] + '">' +
                        top.getCaptionByCustomValue(layerCode, nameType, values[i]) + '</option>');
                }
            }
        }
    }
    $("#LineTypeValue").get(0).selectedIndex = 0;
};