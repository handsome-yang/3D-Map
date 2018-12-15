/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：查询的分页功能和一些查询方法的封装
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 **************************************************/
if (!Query) {
    var Query = {};
}
var lastResult = false;//上一次有数据，为了防止mscrollBar的destroy导致系统异常
Query.PageHelper = function (curEarth) {
    var getparam = [];//存放查询出来的每条数据对应的图层id和名称
    var helper = {};//整个pagehelper对象
    var totalPage = 0;//总页数
    var pageSize = 20;//每页条数
    var params = null;//构造查询条件的数组
    var pageRecord = [];//该页需要显示的记录集合
    var earth = curEarth;//三维球对象
    //键值对 [result --- layername]
    var resultName;
    //键值对 [record --- layername]
    var recordName;
    //键值对 [layername --- layerID]
    var layerGuids;
    //键值对 [record --- type]
    var recordType;
    //缓存池对象
    var pageRecords;

    //根据layerID获取其请求参数 param
    var paramsDic;
    var beginResultIndex, endResultIndex, beginPageIndex, endPageIndex, beginPageRecordIndex, endPageRecordIndex;
    //result的索引---result的记录数
    var resultIndexToRecs;
    //reslut的索引---reslut的param
    var resultIndexToParam;

    var urlParams = null;
    var layerNames = null;
    var paramLen = 0;
    var recordGuids;
    var compCondition;//跨表查询条件
    var fHeader;//表头
    var bShow = false;//是否显示详细气泡
    var htmlStr;//详细信息字符串
    var allWidth2;
    var isLoop = false;
    var highLightObjs = [];//双击高亮对象集合
    var thisSearchLayer = null;//调用searchresult的图层

    /**
     * 初始化参数
     * @param  {[Array]} layerIDs           [查询图层的guid]
     * @param  {[Array]} layerName          [图层名称集合]
     * @param  {[object]} feature           [空间查询条件]
     * @param  {[string]} filter            [属性查询条件]
     * @param  {[number]} queryTypes        [查询类型:1.空间,16属性,17:空间+属性]
     * @param  {[Array]} queryTableType     [查询数据类型0,管点，1管线]
     * @param  {[Array]} header             [datagrid需要显示的标准字段名]
     * @param  {[Array]} aliasHeader        [datagrid表头需要显示的名称]
     * @param  {[string]} compoundCondition [cc参数字符串,一般是道路、行政等跨表查询会用到]
     * @param  {[string]} formatHeader      []
     * @param {[string]} allWidth           [不同的列对于的宽度toDo]
     * @return {[type]}                     [description]
     */
    var _initParams = function (layerIDs, layerName, feature, filter, queryTypes, queryTableType, header, aliasHeader, compoundCondition, formatHeader, allWidth) {
        if (top.LayerManagement.htmlBalloons) {
            top.LayerManagement.htmlBalloons.DestroyObject();
            top.LayerManagement.htmlBalloons = null;
        }
        //实例化
        var importExcelBtn = $("#importExcelBtn");
        importExcelBtn.attr("disabled", true);

        resultName = new ActiveXObject("Scripting.Dictionary");
        recordName = new ActiveXObject("Scripting.Dictionary");
        recordType = new ActiveXObject("Scripting.Dictionary");
        pageRecords = new ActiveXObject("Scripting.Dictionary");
        layerGuids = new ActiveXObject("Scripting.Dictionary");
        recordGuids = new ActiveXObject("Scripting.Dictionary");

        paramsDic = new ActiveXObject("Scripting.Dictionary");
        resultIndexToRecs = new Array;
        resultIndexToParam = new Array;
        compCondition = compoundCondition;//跨表查询条件
        params = [];//查询条件数组
        fHeader = formatHeader;//表头
        //支持只传入一个type [0]或者[1]
        if (layerIDs && layerIDs.length > 0) {
            for (var i = 0; i < layerIDs.length; i++) {
                for (var j = 0; j < queryTableType.length; j++) {
                    params.push({
                        layerID: layerIDs[i],
                        feature: feature,//null
                        filter: filter,//null
                        queryType: queryTypes,//16
                        queryTableType: queryTableType[j]//0,1
                    });
                    getparam.push({
                        layerId: layerIDs[i],
                        layerName: layerName[i]
                    })
                }
            }
        }

        //把layerID与name对应起来
        bingdingLayerGuids(layerIDs, layerName);
        layerNames = layerName;
        allWidth2 = allWidth;
        //先获取总数 获取到counts(记录总数)
        getPageNum(params);
        //alert("记录总数为:" + counts);
        totalPage = Math.ceil(counts / pageSize);
        //获取到beginIndex与endIndex
        getIndexs(0);
        getAllByIndexs(resultIndexToRecs, beginIndex, endIndex);
        var records = getRecords();
        pageRecords.item(0) = records;
        //分页
        initDataGrid(header, aliasHeader, records, importExcelBtn);
        divloaded();//查询完毕将遮罩层去掉
    };
    /**
     * 控制是否显示详细信息的参数
     * @param {[Boolean]} isShow [true,false，是否显示详细信息气泡]
     */
    var setShow = function (isShow) {
        if (isShow) {
            bShow = true;
        } else {
            bShow = false;
        }
    };

    /**
     * 绑定图层的guid与图层的name
     * @param  {[Array]} layerIDs   [所有查询的图层guid集合]
     * @param  {[Array]} layerNames [所有查询的图层Name集合]
     * @return {[type]}            [description]
     */
    var bingdingLayerGuids = function (layerIDs, layerNames) {
        //先判断是否有重复元素
        var tempDic = new ActiveXObject("Scripting.Dictionary");
        var layerNum = layerNames.length;
        for (var i = 0; i < layerNum; i++) {
            var lName = layerNames[i];
            if (tempDic.item(lName)) {
                isLoop = true;
                break;
            } else {
                tempDic.item(lName) = lName;
                isLoop = false;
            }
        }
        if (isLoop) {
            var tempNum = layerNum / 2;
            for (var i = 0; i < tempNum; i++) {
                var layerN = layerNames[2 * i];
                layerGuids.item(layerIDs[i]) = layerN;//增加新项
            }
        } else {
            for (var i = 0; i < layerNum; i++) {
                var layerN = layerNames[i];
                layerGuids.item(layerIDs[i]) = layerN;//增加新项
            }
        }
    };
    var columnName;
    var aliasColumnName;
    /**
     *
     * @param {[Array]} header      [所有需要显示在datagrid的标准字段名称集合]
     * @param {[Array]} aliasHeader [显示在datagrid的表头名称集合]
     * @param {[Array]} pageRecord  [该页需要显示的记录集合]
     * @param {[number]} pageNum    [第几页]
     * @param {[number]} pageSize   [每页条数]
     * @returns {Array}
     */
    var getFieldValue = function (header, aliasHeader, pageRecord, pageNum, pageSize) {
        var values = [];
        columnName = [];//要显示的字段名的集合
        aliasColumnName = [];//表头中文名集合
        if (pageRecord && pageRecord.length > 0) {
            //遍历每一个Record
            for (var i = 0; i < pageRecord.length; i++) {
                var record = pageRecord[i];
                //修改以前的模式,通过另一种方式得到该条记录属于哪个图层,以前的算法存在问题
                var recordIndex = (pageNum - 1) * pageSize + i + 1;
                var totalNow = 0;
                for (var z = 0; z < resultIndexToRecs.length; z++) {
                    var thisEnd = totalNow + resultIndexToRecs[z];
                    if (recordIndex >= totalNow && recordIndex <= thisEnd) {
                        var layerGuid = getparam[z].layerId;
                        break;
                    }
                    totalNow = thisEnd;
                }

                var layerObj = earth.LayerManager.GetLayerByGUID(layerGuid);
                var layerName = layerObj.Name;
                var layerCode = layerObj.PipeLineType;
                var resType = recordType.item(record);
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
                            if (i === 0) {
                                columnName.push(key);
                                aliasColumnName.push(aliasHeader[j]);
                            }
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
                            if (keyUpper === "US_EDEEP") {//终点埋深
                                row[key] = Number(record.US_EDEEP).toFixed(2);
                            }
                            if (keyUpper === "US_SDEEP") {//终点埋深
                                row[key] = Number(record.US_SDEEP).toFixed(2);
                            }
                            if (keyUpper === "US_PT_ALT") {//管点高程
                                row[key] = Number(record.US_PT_ALT).toFixed(2);
                            }
                            if (keyUpper === "US_BD_TIME") {//建设年代
                                var fieldValue = record.US_BD_TIME.substr(0, 10);
                                fieldValue = fieldValue.replace(/-/g, "/");
                                row[key] = fieldValue;
                            }
                            if (keyUpper == "US_PT_TYPE") {//特征点类型
                                row[key] = top.getCaptionByCustomValue(layerCode, "PointType", row[key]);
                            } else if (keyUpper == "US_ATTACHMENT") {//附属物
                                row[key] = top.getCaptionByCustomValue(layerCode, "Attachment", row[key]);
                            } else if (keyUpper == "US_PRESSUR") {//压力
                                row[key] = top.getCaptionByCustomValue(layerCode, "Pressure", row[key]);
                            } else if (keyUpper == "US_LTTYPE") {//埋设方式
                                row[key] = top.getCaptionByCustomValue(layerCode, "LayoutType", row[key]);
                            } else if (keyUpper == "US_LTYPE") {//线型
                                row[key] = top.getCaptionByCustomValue(layerCode, "LineType", row[key]);
                            } else if (keyUpper == "US_PMATER") {//材质
                                row[key] = top.getCaptionByCustomValue(layerCode, "MaterialType", row[key]);
                            } else if (keyUpper == "US_OWNER") {//权属单位
                                row[key] = top.getCaptionByCustomValue(layerCode, "Ownership", row[key]);
                            } else if (keyUpper == "US_STATUS") {//使用状态
                                row[key] = top.getCaptionByCustomValue(layerCode, "StatusType", row[key]);
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
                            if (i === 0) {
                                columnName.push(key);
                                aliasColumnName.push(aliasHeader[j]);
                            }
                            if (key === "US_FEATURE") {
                                row[key] = recordType.item(record);
                                if (resType === "管点") {
                                    var usType = top.getName("US_PT_TYPE", 0, true);
                                    var usAttach = top.getName("US_ATTACHMENT", 0, true);
                                    var usWell = top.getName("US_WELL", 0, true);
                                    //TODO:需要根据井类型做更加合理的判断处理......
                                    if (record[usType]) {
                                        row[key] = top.getCaptionByCustomValue(layerCode, "PointType", record[usType]);
                                    } else if (record[usAttach]) {
                                        row[key] = top.getCaptionByCustomValue(layerCode, "Attachment", record[usAttach]);
                                    } else if (record[usWell]) {
                                        row[key] = record[usWell];
                                    } else {
                                        row[key] = "管点";
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
                    if (layerGuid) {
                        row["thisLayerId"] = layerGuid;
                    }
                    if (layerName) {
                        row["thisLayerName"] = layerName;
                    }
                    values.push(row);
                }
            }
        }
        return values;
    };

    var beginLoadGrid = function () {
        $('#dg').datagrid('loading');
        $('#dg').datagrid('getPager').pagination('loading');
    };
    /**
     * 加载datagrid
     * @param header            要显示的字段的标准名称集合
     * @param aliasHeader       表头中文名称集合
     * @param pageRecord        要显示的记录的集合
     * @param importExcelBtn    导出按钮
     */
    var initDataGrid = function (header, aliasHeader, pageRecord, importExcelBtn) {
        if (pageRecord === undefined || pageRecord.length === 0) {
            totalPage = 1;
            if (importExcelBtn) {
                importExcelBtn.attr("disabled", true);
            }
            if (lastResult) {
                $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
            }
            alert("无查询数据!");
            $("#dg").datagrid({
                pagination: false
            });
            $('#dg').datagrid('loadData', {total: 0, rows: []});

            lastResult = false;
            return;
        } else {
            if (importExcelBtn) {
                importExcelBtn.attr("disabled", false);
            }
        }
        //todo:优化 其他所有的宽度都传进来....
        var endV;

        if (fHeader) {
            endV = fHeader[fHeader.length - 1];
        }
        //解析record
        var values = getFieldValue(header, aliasHeader, pageRecord, 1, pageSize);
        //处理列合并格式
        if (fHeader) {
            for (var i = 0; i < values.length; i++) {
                var rowV = values[i];
                var beginV = fHeader[0];
                var endV = fHeader[1];
                var newV = "";
                if (beginV === "US_PDIAM") {
                    newV = rowV[beginV];
                } else {
                    if (rowV[beginV]) {
                        var rowCount = rowV[beginV].split("X");
                        if (rowCount.length > 1) {
                            newV = rowV[beginV];
                        } else {
                            newV = rowV[beginV] + " X " + rowV[endV];
                        }
                    }
                }


                if (rowV[beginV] === "0" && rowV[endV] === "0") {
                    rowV[beginV] = pageRecord[i].US_SIZE;
                } else {
                    rowV[beginV] = newV;
                }
            }
        }

        var originWidth = (258 - 20) / aliasHeader.length;
        var originWidth2;
        if (allWidth2) {
            originWidth2 = (allWidth2 - 20) / aliasHeader.length;
        }
        var column = [];
        for (var k = 0; k < columnName.length; k++) {
            if (k === 0) {
                columnName[0] = "US_KEY";
            }
            //第一个参数是属性表中的字段名称 第二个参数是显示名称 第三个参数是表格列宽
            if (columnName[k] != endV) {
                if (allWidth2) {
                    column.push({field: columnName[k], title: aliasColumnName[k], width: originWidth2});
                } else {
                    column.push({field: columnName[k], title: aliasColumnName[k], width: originWidth});
                }
            }
        }


        //给数据表格设置表头
        $("#dg").datagrid({
            pageSize: 20,
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
                var options = $('#dg').datagrid('getPager').data("pagination").options;
                var curr = options.pageNumber;
                var currentRecord = pageRecords.Item(curr - 1)[rowIndex];

                var type = recordType.item(currentRecord);
                var key;
                var guid;
                if (type === "管线") {
                    key = top.getName("US_KEY", 1, true);
                    guid = top.getName("US_ID", 1, true);
                } else {
                    key = top.getName("US_KEY", 0, true);
                    guid = top.getName("US_ID", 0, true);
                }
                key = currentRecord[key];
                if (key == undefined) {
                    key = currentRecord["PIPEID"];
                }
                guid = currentRecord[guid];
                var layerName = rowData["thisLayerName"];
                var layerID = rowData["thisLayerId"];//type
                if (!layerID) {
                    return;
                }
                if (bShow) {
                    // 显示气泡  word-break: break-all;word-wrap: break-word; 内容自动换行
                    if (top.SYSTEMPARAMS.balloonAlpha > 0) {
                        htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:310px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
                    } else {
                        htmlStr = '<div style="word-break:keep-all;font-family:Microsoft Yahei;border:1px solid #ccc;white-space:nowrap;overflow:auto;width:255px;height:275px;margin-top:15px;margin-bottom:15px"><table style="font-size:16px;background-color: #fff; color: black">';
                    }

                    var mid;
                    if (type != "管线") {
                        initPointValue(layerID, currentRecord, layerName, type, guid, key, htmlStr);
                    } else {
                        mid = initLineValue(layerID, currentRecord, layerName, htmlStr);
                        htmlStr = htmlStr + mid + '</table></div>';
                        //高亮
                        highlightObject(layerID, type, guid, key, htmlStr);
                    }
                } else {
                    //高亮
                    highlightObject(layerID, type, guid, key);
                }
            },
            nowrap: false
        });
        //单独处理us_key的问题
        if (values && values.length) {
            var standardLineKey = top.getName("US_KEY", 1, true);
            var standardPointKey = top.getName("US_KEY", 0, true);
            for (var i = 0; i < values.length; i++) {
                var item = values[i];
                for (var key in item) {
                    if (key === standardLineKey || key === standardPointKey) {
                        values[i]["US_KEY"] = item[key];
                    }
                }
            }

        }
        //加载数据
        var data = {"total": counts, "rows": values};
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
            afterPageText: "" + totalPage + "页",
            displayMsg: '',
            onSelectPage: function (pageNum, pageSize) {
                var records;
                var keys = pageRecords.Keys().toArray();
                for (var i = 0; i < keys.length; i++) {
                    if (pageRecords.Exists(keys[i]) && i === (pageNum - 1)) {
                        records = pageRecords.item(i);
                    }
                }
                if (records === undefined) {
                    getIndexs(pageNum - 1);
                    getAllByIndexs(resultIndexToRecs, beginIndex, endIndex);
                    records = getRecords(bResultIndex, beginPageInd, beginResInd, eResultIndex, endPageInd, endResInd);
                    //pageRecords.add(pageNum - 1, records);
                    pageRecords.item(pageNum - 1) = records;
                }
                var values = getFieldValue(header, aliasHeader, records, pageNum, pageSize);
                //单独处理us_key的问题
                if (values && values.length) {
                    var standardLineKey = top.getName("US_KEY", 1, true);
                    var standardPointKey = top.getName("US_KEY", 0, true);
                    for (var i = 0; i < values.length; i++) {
                        var item = values[i];
                        for (var key in item) {
                            if (key === standardLineKey || key === standardPointKey) {
                                values[i]["US_KEY"] = item[key];
                            }
                        }
                    }
                }
                //当所有的页面都遍历后 第二次就不用添加了 其他地方也直接从字典里获取即可
                var data = {"total": counts, "rows": values};
                $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
                $('#dg').datagrid('loadData', data);
                $($(".datagrid-body")[1]).mCustomScrollbar();
                lastResult = true;
            }
        });
    };


    /**
     * 获取平面坐标
     * @param layerID   图层guid
     * @param data      服务返回的xml字符串
     * @param usKey     关键字
     * @returns {*}
     */
    function getPlaneCoordinates(layerID, data, usKey) {
        var Record = null;
        var jsonData = $.xml2json(data);
        var us_key = top.getName("US_KEY", 0, true);
        if (jsonData == null || !jsonData.Result || jsonData.Result.num == 0) {
            return;
        } else if (jsonData.Result.num == 1) {
            Record = jsonData.Result.Record;
            if (jsonData.Result.Record[us_key] != usKey) {
                return false;
            }
        } else if (jsonData.Result.num > 1) {
            for (var i = 0; i < jsonData.Result.num; i++) {
                if (jsonData.Result.Record[i][us_key] != usKey) {
                    continue;
                } else {
                    Record = jsonData.Result.Record[i];
                }
            }
        }
        var Coordinates = Record.SHAPE.Point.Coordinates;
        var coord = Coordinates.split(" ");
        var coordinate1 = coord[0].split(",");
        var Coordinate = transformToPlaneCoordinates(coordinate1);
        return Coordinate;
    }

    /**
     * 完成经纬度转平面坐标
     * @param coord     经纬度坐标
     * @returns {{datumCoord: 平面坐标, originCoord: 经纬度}}
     */
    function transformToPlaneCoordinates(coord) {
        var datum = top.SYSTEMPARAMS.pipeDatum;
        var v3s1 = datum.des_BLH_to_src_xy(coord[0], coord[1], coord[2]);//经纬度转平面坐标
        return {datumCoord: v3s1, originCoord: coord};
    }

    var originCoord;
    /**
     * 对双击定位的管线构造要显示的Html
     * @param  {[string]} layerID   [管线图层guid]
     * @param  {[object]} record    [这一条记录]
     * @param  {[string]} layerName [图层名称]
     * @param  {[string]} type      [类型]
     * @param  {[string]} key       [关键字]
     * @return {[string]}           [html字符串]
     */
    var initPointValue = function (layerID, record, layerName, type, guid, key, htmlStr) {
        var strKey = record[top.getName("US_KEY", 0, true)];
        var v3s = null;
        var us_key = top.getName("US_KEY", 0, true);
        var strPara = "(and,equal," + us_key + ",";
        strPara += strKey;
        strPara += ")";
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var layerCode = layer.PipeLineType;
        var strConn = layer.GISServer + "dataquery?service=" + layerID + "&qt=17&dt=point&pc=" + strPara + "&pg=0,100";
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                v3s = getPlaneCoordinates(layerID, xmlDoc, strKey);
                var tv3s = v3s["datumCoord"];
                originCoord = v3s["originCoord"];
                var X = "";
                var Y = "";
                if (tv3s) {
                    X = (parseFloat(tv3s.X)).toFixed(3);
                    Y = (parseFloat(tv3s.Y)).toFixed(3);
                }

                var us_well = record[top.getName("US_WELL", 0, true)];
                var fieldArr = [];
                fieldArr = top.STAMP_config.PointProperty.DEFAULTPOINT;
                var str = "";
                for (var i = 0; i < fieldArr.length; i++) {
                    var fieldCaption = top.getName(fieldArr[i], 0, false);	//显示字段
                    var fieldName = top.getName(fieldArr[i], 0, true);//数据库字段
                    var fieldValue = record[fieldName] || "";
                    var fieldType = "";
                    if (fieldArr[i] == "US_PT_TYPE") {
                        fieldType = "PointType";
                        fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
                    } else if (fieldArr[i] == "US_ATTACHMENT") {
                        fieldType = "Attachment";
                        fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
                    } else if (fieldArr[i] == "US_PRESSUR") {
                        fieldType = "Pressure";
                        fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
                    } else if (fieldArr[i] == "US_LTTYPE") {
                        fieldType = "LayoutType";
                        fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
                    } else if (fieldArr[i] == "US_LTYPE") {
                        fieldType = "LineType";
                        fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
                    } else if (fieldArr[i] == "US_PMATER") {
                        fieldType = "MaterialType";
                        fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
                    } else if (fieldArr[i] == "US_OWNER") {
                        fieldType = "Ownership";
                        fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
                    } else if (fieldArr[i] == "US_BD_TIME") {
                        fieldValue = fieldValue.substr(0, 10);
                        fieldValue = fieldValue.replace(/-/g, "/");
                    } else if (fieldArr[i] == "US_STATUS") {
                        fieldType = "StatusType";
                        fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
                    }
                    if (fieldArr[i] == "X") {
                        fieldCaption = "X坐标";
                        fieldValue = X;
                    } else if (fieldArr[i] == "Y") {
                        fieldCaption = "Y坐标";
                        fieldValue = Y;
                    }
                    if (Number(fieldValue) && (fieldArr[i] == "US_PT_ALT" || fieldArr[i] == "US_NDEEP"
                        || fieldArr[i] == "US_WDEEP" || fieldArr[i] == "US_PSIZE" || fieldArr[i] == "US_WDIA"
                        || fieldArr[i] == "US_ANGLE")) {
                        fieldValue = parseFloat(fieldValue).toFixed(3);
                    }
                    str += '<tr><td  style="width:100px">&nbsp;&nbsp;&nbsp;&nbsp;' + fieldCaption + '</td><td style="width:150px">&nbsp;&nbsp;&nbsp;&nbsp;' + (fieldValue || "") + '</td></tr>';
                }
                htmlStr = htmlStr + str + '</table></div>';
                //高亮
                highlightObject(layerID, type, guid, key, htmlStr);
            }
        }
        earth.DatabaseManager.GetXml(strConn);
    };
    /**
     * 通过图层编码得到详细信息需要显示的字段,在param.js里面
     * @param intLayerCode 图层编码
     * @returns {Array}
     */
    var getFieldArr = function (intLayerCode) {
        var fieldArr = [];
        if (intLayerCode >= 1000 && intLayerCode < 2000) {//电力管线
            fieldArr = top.STAMP_config.LineProperty.DLLINE;
        } else if (intLayerCode >= 2000 && intLayerCode < 3000) {//电信
            fieldArr = top.STAMP_config.LineProperty.DXLINE;
        } else if (intLayerCode >= 3000 && intLayerCode < 4000) {//给水
            fieldArr = top.STAMP_config.LineProperty.JSLINE;
        } else if (intLayerCode >= 4000 && intLayerCode < 5000) {//排水
            fieldArr = top.STAMP_config.LineProperty.PSLINE;
        } else if (intLayerCode >= 5000 && intLayerCode < 6000) {//燃气
            fieldArr = top.STAMP_config.LineProperty.RQLINE;
        } else if (intLayerCode >= 6000 && intLayerCode < 7000) {//热力
            fieldArr = top.STAMP_config.LineProperty.RLLINE;
        } else if (intLayerCode >= 7000 && intLayerCode < 8000) {//工业
            fieldArr = top.STAMP_config.LineProperty.GYLINE;
        } else {//其他
            fieldArr = top.STAMP_config.LineProperty.DEFAULTLINE;
        }
        return fieldArr;
    };
    /**
     * 得到当前字段的正确显示值
     * @param record    此条记录
     * @param fieldName 名称
     * @param intLayerCode 图层编码
     * @param thisName  标准名称
     * @returns {*|string}
     */
    var getThisFieldValue = function (record, fieldName, intLayerCode, thisName) {
        var fieldValue = record[fieldName] || "";
        var fieldType = "";
        if (thisName == "US_PT_TYPE") {
            fieldType = "PointType";
            fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
        } else if (thisName == "US_ATTACHMENT") {
            fieldType = "Attachment";
            fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
        } else if (thisName == "US_PRESSUR") {
            fieldType = "Pressure";
            fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
        } else if (thisName == "US_LTTYPE") {
            fieldType = "LayoutType";
            fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
        } else if (thisName == "US_LTYPE") {
            fieldType = "LineType";
            fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
        } else if (thisName == "US_PMATER") {
            fieldType = "MaterialType";
            fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
        } else if (thisName == "US_OWNER") {
            fieldType = "Ownership";
            fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
        } else if (thisName == "US_BD_TIME") {
            fieldValue = fieldValue.substr(0, 10);
            fieldValue = fieldValue.replace(/-/g, "/");
        } else if (thisName == "US_STATUS") {
            fieldType = "StatusType";
            fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
        }
        if (thisName == "US_SIZE" && fieldValue.indexOf('X') == -1) {
            fieldValue = parseFloat(parseFloat(fieldValue).toFixed(2));
        }
        return fieldValue;
    };
    /**
     * 对双击定位的管线构造要显示的Html
     * @param  {[string]} layerID   [管线图层guid]
     * @param  {[object]} record    [这一条记录]
     * @param  {[string]} layerName [图层名称]
     * @return {[string]}           [html字符串]
     */
    var initLineValue = function (layerID, record, layerName) {
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var intLayerCode = layer.PipeLineType;
        var fieldArr = getFieldArr(intLayerCode);
        var str = "";
        for (var i = 0; i < fieldArr.length; i++) {
            var fieldCaption = top.getName(fieldArr[i], 1, false);	//显示字段
            var fieldName = top.getName(fieldArr[i], 1, true);//数据库字段
            var fieldValue = getThisFieldValue(record, fieldName, intLayerCode, fieldArr[i]);
            str += '<tr><td  style="width:100px;">&nbsp;&nbsp;&nbsp;&nbsp;' + fieldCaption + '</td><td style="width:150px;">&nbsp;&nbsp;&nbsp;&nbsp;' + (fieldValue || "") + '</td></tr>';
        }
        return str;
    };
    /**
     * 对之前双击的停止高亮
     */
    var stopHighLight = function () {
        for (var k = 0; top.LayerManagement.earth != null && k < highLightObjs.length; k++) {
            var currentObj = highLightObjs[k];
            currentObj.StopHighLight();
            highLightObjs.splice(k, 1);
        }
        StatisticsMgr.detachShere();
    };
    /**
     * 双击高亮
     * @param layerID   图层guid
     * @param type      类型:管线或者管点
     * @param guid      模型guid，一般没有用处
     * @param key       模型关键字
     * @param htmlStr   要显示的html字符串
     */
    var highlightObject = function (layerID, type, guid, key, htmlStr) {
        //清除其他的高亮
        stopHighLight();
        if (type === "管点") {
            type = "point";
        }
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        if (!layer) {
            return;
        }
        var i = 0;
        var subLayer = null;
        var searchResult = null;
        var obj = null;

        for (i = 0; i < layer.GetChildCount(); i++) {
            subLayer = layer.GetChildAt(i);
            if (type === "point" || type === "管点") {
                if (subLayer.LayerType === "Container" || subLayer.LayerType === "Vector") {//过滤掉缓冲区图层
                    continue;
                }
            } else if (type === "line" || type === "管线") {
                if ((subLayer.LayerType !== "Container" && subLayer.LayerType !== "Container_Og") || subLayer.LayerType === "Vector") continue;
            }

            var dt = subLayer.LocalSearchParameter.ReturnDataType;
            subLayer.LocalSearchParameter.ClearSpatialFilter();
            subLayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml;
            subLayer.LocalSearchParameter.PageRecordCount = 100;
            subLayer.LocalSearchParameter.PreciseKeyValue = key;
            subLayer.LocalSearchParameter.HasDetail = false;
            subLayer.LocalSearchParameter.HasMesh = false;
            searchResult = subLayer.SearchFromLocal();
            thisSearchLayer = layer;
            subLayer.LocalSearchParameter.ReturnDataType = dt;
            if (searchResult.RecordCount < 1) {
                continue;
            }
            subLayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml;
            obj = filterByKey(searchResult, key);
            subLayer.LocalSearchParameter.ReturnDataType = dt;
            if (obj != null) {
                earth.GlobeObserver.GotoLookat(obj.SphericalTransform.Longitude, obj.SphericalTransform.Latitude, obj.SphericalTransform.Altitude, 50.0, 45.3, 0, 20);
                obj.ShowHighLight();
                highLightObjs.push(obj);
                //显示气泡
                if (bShow) {
                    top.LayerManagement.showHtmlBalloon(obj.SphericalTransform.Longitude, obj.SphericalTransform.Latitude, obj.SphericalTransform.Altitude, htmlStr);
                }
                return;
            }
        }
        //这里有问题 应该是先判断是哪个子图层 然后再把对应的sublayer传递进来 而不是只把最后的一个sublayer传递进来
        if (obj == null && type === "point") {
            StatisticsMgr.sphereGotoLookat(guid, layer.GetChildAt(0), layerID, key, bShow, originCoord, htmlStr);
        }
    };
    /**
     * 找到返回的object
     * @param  {[object]} searchResult [返回结果数组集合]
     * @param  {[string]} key          [需要找的对象的关键字]
     */
    var filterByKey = function (searchResult, key) {
        var obj = null;
        if (searchResult.RecordCount === 0) {
            return null;
        }
        searchResult.gotopage(0);
        for (var i = 0; i < searchResult.RecordCount; i++) {
            var objKey = searchResult.GetLocalObjectKey(i);
            if (objKey == key) {
                obj = searchResult.GetLocalObject(i);
                obj.Underground = true;
                return obj;
            }
        }
        return null;
    };

    //根据记录总数与当前页数获取起始索引与结束索引
    var getIndexs = function (index) {
        var pageNum = Math.ceil(counts / pageSize);
        if (index < pageNum) {
            beginIndex = index * pageSize;
            endIndex = (index + 1) * pageSize - 1;
            if (index === pageNum - 1 && counts <= endIndex) {//如果是尾页
                endIndex = counts - 1;
            }
        } else {
            //页数超过范围
        }
    };

    var bResultIndex;//起始result
    var brecIndex;
    var eResultIndex;
    var eresIndex;

    var beginPageInd;
    var endPageInd;
    var beginResInd;
    var endResInd;
    //获取 起始reslut的起始page页面索引与起始record索引, 结束同理
    var getAllByIndexs = function (resultIndexToRecs, beginIndex, endIndex) {
        //resultIndexToRecs 索引与记录个数
        var cot = 0;
        for (var i in resultIndexToRecs) {
            cot += resultIndexToRecs[i];
            if (beginIndex < cot) {
                bResultIndex = i;
                brecIndex = beginIndex - (cot - resultIndexToRecs[i]);
                //todo:根据该result的个数计算起始索引所在的页面索引
                break;
            }
        }
        cot = 0;
        for (var i in resultIndexToRecs) {
            cot += resultIndexToRecs[i];
            if (endIndex < cot) {
                eResultIndex = i;
                eresIndex = resultIndexToRecs[i] - (cot - endIndex);
                //根据i位置计算页面索引与起始索引
                break;
            }
        }

        //起始:根据reslut与其中的位置来获取第几页的第几个索引值
        if (bResultIndex != undefined && brecIndex != undefined) {
            var resultC = resultIndexToRecs[bResultIndex];
            var pageN = Math.ceil(resultC / pageSize);
            for (var m = 0; m < pageN; m++) {
                if (brecIndex < ((m + 1) * pageSize) && brecIndex >= m * pageSize) {
                    //当前页面索引为m
                    beginPageInd = m;
                    beginResInd = brecIndex - m * pageSize;
                }
            }
        }

        //结束:根据reslut与其中的位置来获取第几页的第几个索引值
        if (eResultIndex != undefined && eresIndex != undefined) {
            var eResultC = resultIndexToRecs[eResultIndex];
            var ePageN = Math.ceil(eResultC / pageSize);
            for (var n = 0; n < ePageN; n++) {
                if (eresIndex < ((n + 1) * pageSize) && eresIndex >= n * pageSize) {
                    //当前页面索引为m
                    endPageInd = n;
                    endResInd = eresIndex - n * pageSize;
                }
            }
        }

        //起始索引:bResultIndex beginPageInd beginResInd
        //结束索引:eResultIndex endPageInd endResInd
    };

    //根据result的索引等获取record记录[获取所有record的入口]
    //bResultIndex, beginPageInd, beginResInd, eResultIndex, endPageInd, endResInd
    var getRecords = function () {
        //同一页面
        if (bResultIndex != undefined && bResultIndex === eResultIndex) {
            return getReordsByIndex(bResultIndex);
        } else {//跨页
            return getReordsByIndexs();
        }
    };
    /**
     * 通过索引得到所有记录
     * @param reslutIndex   其实索引
     * @returns {type[]}
     */
    var getReordsByIndex = function (reslutIndex) {
        var param = resultIndexToParam[reslutIndex];
        var layerName = layerGuids.item(param.layerID);
        var result = getQueryHandler(param);
        var records = getRecordsByPage(result, beginPageInd, endPageInd, beginResInd, endResInd, layerName, param.layerID);
        return records;
    };

    //建立键值对关系 获取所有的param与对应的layerName
    var setParams = function () {
        urlParams = [];
        for (var i = 0; i < resultIndexToParam.length; i++) {
            if (i >= bResultIndex && i <= eResultIndex) {
                urlParams.push(resultIndexToParam[i]);
            }
        }
        return [urlParams, layerNames];
    };
    /**
     * 根据索引活得所有记录
     * @returns {Array}
     */
    var getReordsByIndexs = function () {
        var pms = setParams();
        paramLen = urlParams.length;
        getInternalResult();
        return internalRecords;
    };
    /**
     * 获取结果
     */
    var getInternalResult = function () {
        internalRecords = [];
        afterRecords = [];
        totalRecords = [];
        beforeRecords = [];
        getResultsHandler();
    };

    var loop = 0;
    var internalRecords = [];
    var afterRecords = [];
    var beforeRecords = [];
    var totalRecords = [];
    /**
     * 获取结果
     */
    var getResultsHandler = function () {
        if (urlParams.length === 0) {
            loop = 0;
        }
        if (urlParams && urlParams.length > 0) {//这里的循环控制有问题......
            var perQueryParam = urlParams.shift();//这里要根据索引来计算
            //var layerName = layerNames[loop];
            var indexParam = 0;
            for (var i = resultIndexToParam.length - 1; i >= 0; i--) {
                if (resultIndexToParam[i] === perQueryParam) {
                    indexParam = i;
                }
            }
            var floorNum = Math.floor(indexParam / 2);
            var layerName = layerNames[indexParam];//这里的取值有问题？
            var keys = layerGuids.Keys().toArray();//将obj对象的键值转换成数组
            var layerGuid;
            //对应图层的guid 很关键......
            for (var i = 0; i < keys.length; i++) {
                if (isLoop) {
                    layerGuid = keys[floorNum];//如果layerNames有重复值
                } else {
                    layerGuid = keys[indexParam];//如果layerNames没有重复值
                }
            }
            var records;
            if (loop === 0) {          //首页
                getAfterQueryHandler(perQueryParam, layerName, beginPageInd, beginResInd, layerGuid);
            } else if (loop === paramLen - 1) {        //尾页
                getBeforeQueryHandler(perQueryParam, layerName, endPageInd, endResInd, layerGuid);
            } else {         //中间页
                getTotalQueryHandler(perQueryParam, layerName, layerGuid);
            }
        }
    };
    //获取一个result完整的record
    var getTotalQueryHandler = function (perQueryParam, layerName, layerGuid) {
        var layerID = perQueryParam.layerID;
        var feature = perQueryParam.feature;
        var filter = perQueryParam.filter;
        var queryType = perQueryParam.queryType;
        var queryTableType = perQueryParam.queryTableType;

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
            if (typeof(filter) == "object") {
                param.Filter = filter[queryTableType];
            } else {
                param.Filter = filter;
            }
        }
        if (feature != null) {
            param.SetSpatialFilter(feature);
        }
        if (compCondition != null) {
            var cc = compCondition.split(",");
            param.SetCompoundCondition(cc[0], cc[1], parseFloat(cc[2]).toFixed(3));
        }
        if (queryTableType != null) {
            param.QueryTableType = queryTableType;//[0] [0,1]
        }
        param.QueryType = queryType;
        param.PageRecordCount = pageSize;
        var result = new Object();
        result = subLayer.SearchFromGISServer();
        if (result) {
            if (result.RecordCount != 0) {
                getTotalRecord2(result, layerName, layerGuid);
            }
            loop += 1;
            internalRecords = [];
            internalRecords = internalRecords.concat(afterRecords, totalRecords, beforeRecords);
            getResultsHandler();
        }
    };
    /**
     * 获取总的结果
     * @param result    接口返回的额对象
     * @param layerName 图层，名称
     * @param layerGuid 图层guid
     */
    var getTotalRecord2 = function (result, layerName, layerGuid) {
        var recordNum = result.RecordCount;
        var pageNum = Math.ceil(recordNum / pageSize);
        if (pageNum > 0) {
            for (var i = 0; i < pageNum; i++) {
                var currentRecords = getRecordByPage(result, i, layerName, layerGuid);
                totalRecords = totalRecords.concat(currentRecords);
            }
        }
        loop += 1;
        getResultsHandler();
    };
    /**
     * 通过页码得到结果
     * @param result        接口返回searchResult
     * @param pageIndex     第几页
     * @param layerName     图层，名称
     * @param layerGuid     图层guid
     * @returns {Array}
     */
    var getRecordByPage = function (result, pageIndex, layerName, layerGuid) {
        var bPage = result.gotoPage(pageIndex);
        var json = $.xml2json(bPage);
        var records = json.Result.Record;
        if (records == undefined) {
            return;
        }
        var type = json.Result.geometry;
        var displayType = type === "point" ? "管点" : "管线";
        type = type === "point" ? "point" : "line";
        var bRecords = [];
        if (records.length && records.length > 0) {
            for (var i = 0; i < records.length; i++) {
                bRecords.push(records[i]);
                //绑定每一个layer的名称到Record
                recordName.item(records[i]) = layerName;
                recordType.item(records[i]) = displayType;
                recordGuids.item(records[i]) = layerGuid;
                if (records[i].US_FEATURE === "") {
                    records[i].US_FEATURE = displayType;
                }
            }
        } else {//说明只有一个record记录 这个时候不会返回数组(xml2json的bug)
            bRecords.push(records);
            //绑定每一个layer的名称到Record
            recordName.item(records) = layerName;
            recordType.item(records) = displayType;
            recordGuids.item(records) = layerGuid;
            if (records.US_FEATURE === "") {
                records.US_FEATURE = displayType;
            }
        }
        return bRecords;
    };
    /**
     * 通过条件进行数据库查询
     * @param perQueryParam     查询条件对象
     * @param layerName         图层名称
     * @param endPageInd        结束页面索引
     * @param endResInd         结束结果索引
     * @param layerGuid         图层guid
     */
    var getBeforeQueryHandler = function (perQueryParam, layerName, endPageInd, endResInd, layerGuid) {
        var layerID = perQueryParam.layerID;
        var feature = perQueryParam.feature;
        var filter = perQueryParam.filter;
        var queryType = perQueryParam.queryType;
        var queryTableType = perQueryParam.queryTableType;

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
            if (typeof(filter) == "object") {
                param.Filter = filter[queryTableType];
            } else {
                param.Filter = filter;
            }
        }
        if (feature != null) {
            param.SetSpatialFilter(feature);
        }
        if (compCondition != null) {
            var cc = compCondition.split(",");
            param.SetCompoundCondition(cc[0], cc[1], parseFloat(cc[2]).toFixed(3));
        }
        if (queryTableType != null) {
            param.QueryTableType = queryTableType;//[0] [0,1]
        }
        param.QueryType = queryType;
        param.PageRecordCount = pageSize;
        var result = new Object();
        result = subLayer.SearchFromGISServer();
        if (result) {
            if (result.RecordCount != 0) {
                beforeRecords = getBeforeRecord(result, endPageInd, endResInd, layerName, layerGuid);
            }
            loop += 1;
            internalRecords = [];
            internalRecords = internalRecords.concat(afterRecords, totalRecords, beforeRecords);
            getResultsHandler();
        }
    };

    var getBeforeRecord = function (result, pageIndex, endIndex, layerName, layerGuid) {
        var pageNum = Math.ceil(result.RecordCount / pageSize);
        var bRecords = [];
        for (var i = 0; i < pageNum; i++) {
            if (i < pageIndex) {//处理起始所有
                var bPage = result.gotoPage(i);
                var json = $.xml2json(bPage);
                var records = json.Result.Record;
                if (records == undefined) {
                    continue;
                }
                var type = json.Result.geometry;
                var displayType = type === "point" ? "管点" : "管线";
                type = type === "point" ? "point" : "line";
                if (records.length && records.length > 0) {
                    for (var j = 0; j < records.length; j++) {
                        var res = records[j];
                        bRecords.push(res);
                        //绑定每一个layer的名称到Record
                        recordName.item(res) = layerName;
                        recordType.item(res) = displayType;
                        recordGuids.item(res) = layerGuid;
                        if (res.US_FEATURE === "") {
                            res.US_FEATURE = displayType;
                        }
                    }
                } else {//说明只有一个record记录 这个时候不会返回数组(xml2json的bug)
                    bRecords.push(records);
                    //绑定每一个layer的名称到Record
                    recordName.item(records) = layerName;
                    recordType.item(records) = displayType;
                    recordGuids.item(records) = layerGuid;
                    if (records.US_FEATURE === "") {
                        records.US_FEATURE = displayType;
                    }
                }
            }
            if (i === pageIndex) {
                var bPage = result.gotoPage(pageIndex);
                var json = $.xml2json(bPage);
                var records = json.Result.Record;
                if (records == undefined || records == "undefined") {
                    continue;
                }
                var type = json.Result.geometry;
                var displayType = type === "point" ? "管点" : "管线";
                type = type === "point" ? "point" : "line";
                if (records.length && records.length > 0) {
                    for (var k = 0; k < records.length; k++) {
                        if (k <= endIndex) {
                            var res = records[k];
                            bRecords.push(res);
                            //绑定每一个layer的名称到Record
                            recordName.item(res) = layerName;
                            recordType.item(res) = displayType;
                            recordGuids.item(res) = layerGuid;
                            if (res.US_FEATURE === "") {
                                res.US_FEATURE = displayType;
                            }
                        }
                    }
                } else {
                    bRecords.push(records);
                    //绑定每一个layer的名称到Record
                    recordName.item(records) = layerName;
                    recordType.item(records) = displayType;
                    recordGuids.item(records) = layerGuid;
                    if (records.US_FEATURE === "") {
                        records.US_FEATURE = displayType;
                    }
                }
            }
        }
        return bRecords;
    };

    var getAfterQueryHandler = function (perQueryParam, layerName, beginPageInd, beginResInd, layerGuid) {
        var layerID = perQueryParam.layerID;
        var feature = perQueryParam.feature;
        var filter = perQueryParam.filter;
        var queryType = perQueryParam.queryType;
        var queryTableType = perQueryParam.queryTableType;

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
        if (compCondition != null) {
            var cc = compCondition.split(",");
            param.SetCompoundCondition(cc[0], cc[1], parseFloat(cc[2]).toFixed(3));
        }
        param.Filter = "";
        if (filter != null) {
            if (typeof(filter) == "object") {
                param.Filter = filter[queryTableType];
            } else {
                param.Filter = filter;
            }
        }
        if (feature != null) {
            param.SetSpatialFilter(feature);
        }
        if (queryTableType != null) {
            param.QueryTableType = queryTableType;//[0] [0,1]
        }
        param.QueryType = queryType;
        param.PageRecordCount = pageSize;
        var result = new Object();
        result = subLayer.SearchFromGISServer();
        if (result) {
            if (result.RecordCount != 0) {
                afterRecords = getAfterRecord2(result, beginPageInd, beginResInd, layerName, layerGuid);
            }
            loop += 1;
            internalRecords = [];
            internalRecords = internalRecords.concat(afterRecords, totalRecords, beforeRecords);
            getResultsHandler();
        }
    };

    var getAfterRecord2 = function (result, pageIndex, beginIndex, layerName, layerGuid) {
        var pageNum = Math.ceil(result.RecordCount / pageSize);
        var bRecords = [];
        for (var i = 0; i < pageNum; i++) {
            if (i === pageIndex) {
                var bPage = result.gotoPage(i);
                var json = $.xml2json(bPage);
                var records = json.Result.Record;
                if (records == undefined) {
                    return;
                }
                var type = json.Result.geometry;
                var displayType = type === "point" ? "管点" : "管线";
                type = type === "point" ? "point" : "line";
                if (records.length && records.length > 0) {
                    for (var j = 0; j < records.length; j++) {
                        if (j >= beginIndex) {
                            var res = records[j];
                            bRecords.push(res);
                            //绑定每一个layer的名称到Record
                            recordName.item(res) = layerName;
                            recordType.item(res) = displayType;
                            recordGuids.item(res) = layerGuid;
                            if (res.US_FEATURE === "") {
                                res.US_FEATURE = displayType;
                            }
                        }
                    }
                } else {//说明只有一个record记录 这个时候不会返回数组(xml2json的bug)
                    bRecords.push(records);
                    //绑定每一个layer的名称到Record
                    recordName.item(records) = layerName;
                    recordType.item(records) = displayType;
                    recordGuids.item(records) = layerGuid;
                    if (records.US_FEATURE === "") {
                        records.US_FEATURE = displayType;
                    }
                }
            }
            if (i > pageIndex) {
                var bPage = result.gotoPage(i);
                var json = $.xml2json(bPage);
                var records = json.Result.Record;
                var type = json.Result.geometry;
                var displayType = type === "point" ? "管点" : "管线";
                type = type === "point" ? "point" : "line";
                if (records.length && records.length > 0) {
                    for (var j = 0; j < records.length; j++) {
                        var res = records[j];
                        bRecords.push(res);
                        //绑定每一个layer的名称到Record
                        recordName.item(res) = layerName;
                        recordType.item(res) = displayType;
                        recordGuids.item(res) = layerGuid;
                        if (res.US_FEATURE === "") {
                            res.US_FEATURE = displayType;
                        }
                    }
                } else {//说明只有一个record记录 这个时候不会返回数组(xml2json的bug)
                    bRecords.push(records);
                    //绑定每一个layer的名称到Record
                    recordName.item(records) = layerName;
                    recordType.item(records) = displayType;
                    recordGuids.item(records) = layerGuid;
                    if (records.US_FEATURE === "") {
                        records.US_FEATURE = displayType;
                    }
                }
            }
        }
        ;
        return bRecords;
    };
    /**
     * 得到查询结果
     * @param  {[object]} perQueryParam [构造的查询对象]
     * @return {[xml   ]}               [服务返回来的xml字符串]
     */
    var getQueryHandler = function (perQueryParam, pageCount) {
        var layerID = perQueryParam.layerID;
        var feature = perQueryParam.feature;
        var filter = perQueryParam.filter;
        var queryType = perQueryParam.queryType;
        var queryTableType = perQueryParam.queryTableType;

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
            if (typeof(filter) == "object") {
                param.Filter = filter[queryTableType];
            } else {
                param.Filter = filter;
            }
        }
        if (compCondition != null) {
            var cc = compCondition.split(",");
            param.SetCompoundCondition(cc[0], cc[1], parseFloat(cc[2]).toFixed(3));
        }
        if (feature != null) {
            param.SetSpatialFilter(feature);
        }
        if (queryTableType != null) {
            param.QueryTableType = queryTableType;//[0] [0,1]
        }
        param.QueryType = queryType;
        param.PageRecordCount = pageCount || pageSize;
        var result = new Object();
        result = subLayer.SearchFromGISServer();
        return result;
    };
    /**
     * 通过页码得到当前需要展示的内容
     * @param  {[object]} result         [searchResult对象]
     * @param  {[number]} beginPageIndex [起始索引]
     * @param  {[number]} endPageIndex   [结束索引]
     * @param  {[number]} beginIndex     [description]
     * @param  {[number]} endIndex       [description]
     * @param  {[string]} layerName      [图层名称]
     * @param  {[string]} layerGuid      [图层guid]
     * @return {[type]}                [description]
     */
    var getRecordsByPage = function (result, beginPageIndex, endPageIndex, beginIndex, endIndex, layerName, layerGuid) {
        //起始页
        var bPage = result.gotoPage(beginPageIndex);
        if (result.RecordCount > 0) {

            var json = $.xml2json(bPage);
            var records = json.Result.Record;
            if (records == undefined || records == "undefined") {
                return;
            }
            var type = json.Result.geometry;
            var displayType = type === "point" ? "管点" : "管线";
            type = type === "point" ? "point" : "line";
            var bRecords = [];

            if (beginPageIndex === endPageIndex) {
                if (records.length && records.length > 0) {
                    for (var i = 0; i < records.length; i++) {
                        if (i >= beginIndex && i <= endIndex) {
                            bRecords.push(records[i]);
                            //绑定每一个layer的名称到Record
                            recordName.item(records[i]) = layerName;
                            recordType.item(records[i]) = displayType;
                            recordGuids.item(records[i]) = layerGuid;
                            if (records[i].US_FEATURE === "") {
                                records[i].US_FEATURE = displayType;
                            }
                        }
                    }
                } else {//说明只有一个record记录 这个时候不会返回数组(xml2json的bug)
                    bRecords.push(records);
                    //绑定每一个layer的名称到Record
                    recordName.item(records) = layerName;
                    recordType.item(records) = displayType;
                    recordGuids.item(records) = layerGuid;
                    if (records.US_FEATURE === "") {
                        records.US_FEATURE = displayType;
                    }
                }
            } else {
                //起始页
                if (records.length && records.length > 0) {
                    for (var i = 0; i < records.length; i++) {
                        if (i >= beginIndex) {
                            bRecords.push(records[i]);
                            //绑定每一个layer的名称到Record
                            recordName.item(records[i]) = layerName;
                            recordType.item(records[i]) = displayType;
                            recordGuids.item(records[i]) = layerGuid;
                            if (records[i].US_FEATURE === "") {
                                records[i].US_FEATURE = displayType;
                            }
                        }
                    }
                } else {//说明只有一个record记录 这个时候不会返回数组(xml2json的bug)
                    bRecords.push(records);
                    //绑定每一个layer的名称到Record
                    recordName.item(records) = layerName;
                    recordType.item(records) = displayType;
                    recordGuids.item(records) = layerGuid;
                    if (records.US_FEATURE === "") {
                        records.US_FEATURE = displayType;
                    }
                }

                var mRecords = [];
                var intervalPage = endPageIndex - beginPageIndex;
                if (intervalPage > 1) {//至少有一个完整页(这里只处理完整页 首页与尾页单独处理)
                    for (var k = 1; k < intervalPage; k++) {
                        var mPage = result.gotoPage(k + beginPageIndex);
                        var mjson = $.xml2json(mPage);
                        var mRes = mjson.Result.Record;
                        if (mRes.length && mRes.length > 0) {
                            for (var m = 0; m < mRes.length; m++) {
                                mRecords.push(mRes[m]);
                                //绑定每一个layer的名称到Record
                                recordName.item(mRes[m]) = layerName;
                                recordType.item(mRes[m]) = displayType;
                                recordGuids.item(mRes[m]) = layerGuid;
                                if (mRes[m].US_FEATURE === "") {
                                    mRes[m].US_FEATURE = displayType;
                                }
                            }
                        } else {//说明只有一个record记录 这个时候不会返回数组(xml2json的bug)
                            mRecords.push(mRes);
                            //绑定每一个layer的名称到Record
                            recordName.item(mRes) = layerName;
                            recordType.item(mRes) = displayType;
                            recordGuids.item(mRes) = layerGuid;
                            if (mRes.US_FEATURE === "") {
                                mRes.US_FEATURE = displayType;
                            }
                        }
                    }
                }

                //结束页
                var ePage = result.gotoPage(endPageIndex);
                var ejson = $.xml2json(ePage);
                var res = ejson.Result.Record;
                var eRecords = [];
                if (res.length && res.length > 0) {
                    for (var j = 0; j < res.length; j++) {
                        if (j <= endIndex) { // j <= endIndex
                            eRecords.push(res[j]);
                            //绑定每一个layer的名称到Record
                            recordName.item(res[j]) = layerName;
                            recordType.item(res[j]) = displayType;
                            recordGuids.item(res[j]) = layerGuid;
                            if (res[j].US_FEATURE === "") {
                                res[j].US_FEATURE = displayType;
                            }
                        }
                    }
                } else {//说明只有一个record记录 这个时候不会返回数组(xml2json的bug)
                    eRecords.push(res);
                    //绑定每一个layer的名称到Record
                    recordName.item(res) = layerName;
                    recordType.item(res) = displayType;
                    recordGuids.item(res) = layerGuid;
                    if (res.US_FEATURE === "") {
                        res.US_FEATURE = displayType;
                    }
                }
                bRecords = bRecords.concat(mRecords, eRecords);
            }
        }
        //该页面全部记录集
        return bRecords;
    };
    /***************/
    //获取总记录数
    var getPageNum = function () {
        _query();
    };


    var indRes = 0;
    var counts = 0;
    var _query = function () {
        if (params && params.length > 0) {
            var perQueryParam = params.shift();
            resultIndexToParam[indRes] = perQueryParam;
            loopControl(perQueryParam);
        }
    };
    var paramsLayerNames = [];
    /**
     * 第一次遍历查询 为了获取结果集中的记录总数 便于后续的分页计算
     * @param  {[type]} perQueryParam [description]
     * @return {[type]}               [description]
     */
    var loopControl = function (perQueryParam) {

        var layerID = perQueryParam.layerID;
        var feature = perQueryParam.feature;
        var filter = perQueryParam.filter;
        var queryType = perQueryParam.queryType;
        var queryTableType = perQueryParam.queryTableType;

        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        paramsLayerNames.push({layerName: layer.name, param: perQueryParam});
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
        if (compCondition != null) {
            var cc = compCondition.split(",");
            param.SetCompoundCondition(cc[0], cc[1], parseFloat(cc[2]).toFixed(3));
        }
        param.Filter = "";
        if (filter != null) {
            if (typeof(filter) == "object") {
                param.Filter = filter[queryTableType];
            } else {
                param.Filter = filter;
            }
        }
        if (feature != null) {
            param.SetSpatialFilter(feature);
        }
        if (queryTableType != null) {
            param.QueryTableType = queryTableType;//[0] [0,1]
        }
        param.QueryType = queryType;
        param.PageRecordCount = 1;
        var result = new Object();
        result = subLayer.SearchFromGISServer();
        if (result.RecordCount < 0) {
            counts += 0;
            resultIndexToRecs[indRes] = 0;
            indRes += 1;
        } else {
            var resultGeo = $.xml2json(result.GotoPage(0)).Result.geometry;
            if (resultGeo == "") {//防止服务出问题返回的数据有问题，加上判断
                counts += 0;
                resultIndexToRecs[indRes] = 0;
                indRes += 1;
            } else {
                counts += result.RecordCount;
                resultIndexToRecs[indRes] = result.RecordCount;
                indRes += 1;
            }
        }
        _query();
    };
    //获取总记录数完毕!
    /***************/

    /**
     * 根据页面索引获取该页面所有的record(记录)
     * 起始索引的判断有问题...todo
     * @param  {Number} index 页面索引
     * @return {Array}
     */
    var beginIndex;
    var endIndex;
    var getIndex = function (index) {
        beginIndex = index * pageSize;
        endIndex = (index + 1) * pageSize - 1;
        _query(beginIndex, endIndex);
        //根据位置获取records
        var records = getRecordByIndexs(beginResultIndex, endResultIndex, beginPageIndex, endPageIndex, beginPageRecordIndex, endPageRecordIndex);
        return records;
    };
    var getTotalNum = function () {
        return counts;
    };
    helper.getTotalNum = getTotalNum;
    helper.initParams = _initParams;
    helper.setShow = setShow;
    helper.stopHighLight = stopHighLight;
    helper.beginLoadGrid = beginLoadGrid;
    helper.highlightObject = highlightObject;
    helper.initPointValue = initPointValue;
    helper.initLineValue = initLineValue;
    helper.getFieldArr = getFieldArr;
    helper.getThisFieldValue = getThisFieldValue;
    helper.getQueryHandler = getQueryHandler;
    return helper;
};
$(window).resize(function () {
    setGidDivHeight();
});