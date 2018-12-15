/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：追踪分析js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
$(function () {
    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;
    var layer = earth.LayerManager.GetLayerByGUID(projectId);
    setDivHeight();
    var layerGUID = "";  // 管段所属图层的GUID
    var objGUID = "";   // 选中管线的GUID
    var feature = null;//需要生成的查询范围面
    /**
     * 设置分析按钮禁用与否
     */
    var btnAnalyzeEnabled = function () {
        if ($("#txtObjId").val() != "") {
            $("#btnAnalyze").attr("disabled", false);
            $("#btnFlyToPipe").attr("disabled", false);

        } else {
            $("#btnAnalyze").attr("disabled", true);
            $("#btnFlyToPipe").attr("disabled", true);
        }
    };
    /**
     * 管段input事件change 事件
     */
    $("#txtObjId").change(function () {
        btnAnalyzeEnabled();
    });
    var lineObjArr = [];//需要高亮的对象
    /**
     * 解析查询结果，添加到结果表格中
     * @param result 查询结果
     * @param guid 图层ID
     */
    var parseResult = function (result, guid, type, queryResult) {
        if (result.num <= 0) {
            return;
        }
        var displayType = "管线";
        var nameType = 1;
        if (type == "point") {
            displayType = "管点";
            nameType = 0;
        }
        var keyField = top.getNameNoIgnoreCase("US_KEY", nameType, true);
        var keyArr = [];
        if(queryResult && queryResult.RecordCount && queryResult.GotoPage(0)){
            var record = queryResult.GotoPage(0);
            record = $.xml2json(record);
            if(!record || !record.Result || !record.Result.Record){
                return;
            }
            if(queryResult.RecordCount == 1){//只有一条记录
                record.Result.Record = [record.Result.Record];
            }
            for(var j = 0; j<record.Result.num; j++){
                var key = record.Result.Record[j][keyField];
                keyArr.push(key);
            }
        }
        if(!keyArr){
            return;
        }
        var template = '<tr ondblclick=analysisHighlightObject("$LayerID","$TYPE","$GUID","$KEY")' +
            '><td class="col1">$INDEX</td><td class="col2">$DISPLAYTYPE</td></tr>';
        var records = result.Record;
        
        if (result.num <= 0) {
            return;
        } else if (result.num == 1) {
            records = [records];
        }
        for (var i = 0; i < records.length; i++) {
            var keyValue = records[i][keyField];
            if($.inArray(keyValue, keyArr) < 0){//如果分析出来的结果不在100米缓冲范围内，那么不显示结果
                continue;
            }
            $("#tblResult>tbody").append(template.replace("$INDEX", records[i][top.getNameNoIgnoreCase("US_KEY", nameType, true)])
                .replace("$DISPLAYTYPE", displayType)
                .replace("$LayerID", guid.split("_")[0])
                .replace("$TYPE", type)
                .replace("$GUID", "")
                .replace("$KEY", keyValue));
            lineObjArr.push({
                layerId: guid.split("_")[0],
                type: type,
                guid: "",
                key: keyValue
            });
        }
        $("#importExcelBtn").attr("disabled", false);
        $("#showResult").attr("disabled", false);
        $("#detailData").attr("disabled", false);
    };
    /**
     * 通过中心点和半径生成一个类似圆形的多边形
     * @param  {[type]} center [中心点坐标]
     * @param  {[type]} radius [半径]
     * @return {[type]}        [description]
     */
    function createCircleV3s(center, radius){
        var v3s = earth.Factory.CreateVector3s();
        var bufPolygon = earth.Factory.CreateElementCircle(earth.Factory.CreateGuid(), "");
        var tran = bufPolygon.SphericalTransform;
        var thisAltitude = earth.Measure.MeasureTerrainAltitude(center.X, center.Y);
        tran.SetLocationEx(center.X, center.Y, thisAltitude);
        var vecs = earth.GeometryAlgorithm.CreatePolygonFromCircle(radius, 24);
        for(var i=0;i<vecs.Count;i++){
            var vec = tran.TransformCartesionToSphrerical(vecs.Items(i));
            v3s.Add(vec.X, vec.Y, vec.Z);
        }
        return v3s;
    }
    /**
     * 选取管段点击事件
     */
    $("#btnSelectPipe").click(function () {
        var isChecked = $("#showResult").attr("checked");
        if (isChecked == "checked" || isChecked == true) {
            if (lineObjArr.length > 0) {
                analysisShowResult(false, lineObjArr);
                $("#showResult").attr("checked", false);
            }
        }
        top.LayerManagement.clearHtmlBalloons();
        earth.focus();
        analysisSelectObj($("#txtObjId"), $("#btnAnalyze"), $("#txtDist"), "", true, true);
    });
    /**
     * 对分析半径进行控制并且再说输入的过程中实时控制缓冲面的大小
     */
    $("#txtDist").keyup(function (event) {
        checkNum($("#txtDist")[0], true, 2);
        var value = $("#txtDist").val();
        if (!value || value == 0) {
            $("#btnAnalyze").attr("disabled", true);
        } else {
            var pipeValue = $("#txtObjId").val();
            if (pipeValue) {
                $("#btnAnalyze").attr("disabled", false);
            } else {
                $("#btnAnalyze").attr("disabled", true);
            }
        }
    });
    /**
     * 流向的radio点击change事件
     */
    $("input[name='direction']").change(function () {
        $("#tblResult>tbody").empty();
        clearHighLight();
        if (lineObjArr.length > 0) {
            analysisShowResult(false, lineObjArr);
        }
        $("#showResult").removeAttr("checked");
        top.LayerManagement.clearHtmlBalloons();
    });
    /**
     * 分析点击事件
     */
    $("#btnAnalyze").click(function () {
        divload("tablediv");
        $("#tblResult>tbody").empty();
        $("#tabhead").css("visibility", "visible");
        clearHighLight();
        if (lineObjArr.length > 0) {//先清除高亮
            analysisShowResult(false, lineObjArr);
        }
        layerGUID = obj.layerGUID;
        objGUID = obj.key;
        lineObjArr = [];
        var query = Query.PageHelper(earth);
        feature = createCircleV3s(selectCenter, parseFloat($("#txtDist").val()) + parseFloat(selRadius));
        //追踪分析现改为先进行调用追踪分析的服务，半径给值大于界面上的半径，然后再进行一个圆域查询，求交得到最后结果
        var tracingRadius = parseFloat($("#txtDist").val()) * 2 + parseFloat(selRadius);//因为追踪分析是以管线的中心点来计算的,所以半径需要加上管线的长度的一般
        var direction = $("input[name='direction']:checked").val();
        $("#showResult").removeAttr("checked");
        var strConn = earth.LayerManager.GetLayerByGUID(layerGUID.split("_")[0]).GISServer +
            "network?rt=tracing&service=" + layerGUID.split("_")[0];
        strConn += "&aparam=0," + obj.key + ",";
        strConn += direction + "," + tracingRadius;
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                $("#tblResult>tbody").empty();
                var json = $.xml2json(xmlDoc);
                if (json == null || !json.TracingResult) {
                    return;
                }
                result = json.TracingResult.PointResult;
                var pointParam = {
                    layerID: layerGUID.split("_")[0],
                    feature: feature,
                    filter: "",
                    queryType: 16,
                    queryTableType: 0
                };
                var lineParam = {
                    layerID: layerGUID.split("_")[0],
                    feature: feature,
                    filter: "",
                    queryType: 16,
                    queryTableType: 1
                }
                var queryPointResult = query.getQueryHandler(pointParam, 10000);
                parseResult(result, layerGUID, "point", queryPointResult);
                var result = json.TracingResult.LineResult;
                var queryLineResult = query.getQueryHandler(lineParam, 10000);
                parseResult(result, layerGUID, "line", queryLineResult);
                if ("" == $("#tblResult>tbody").text()) {
                    alert("分析结果为空！");
                }
                divloaded();
            }
        };
        earth.DatabaseManager.GetXml(strConn);
    });
    /**
     * 显示结果点击事件
     */
    $("#showResult").click(function () {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        analysisShowResult(checkTag, lineObjArr);
    });
    //显示详细信息
    $("#detailData").click(function () {
        bShow = $('input:checkbox[name="detailData"]').is(":checked");
        if (!bShow) {
            top.LayerManagement.clearHtmlBalloons();
        }
    });
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        var tabObj = $("#tblResult>tbody")[0];
        var columns = ["编号", "类型"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    $(window).unload(function () {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            analysisShowResult(false, lineObjArr);
        }
        StatisticsMgr.detachShere();
        stophighlight();
        analysisClearBuffer();
        clearHighLight();
    });
});