/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：SQL查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var query;
var clickValue = null;

$(function () {                                        
    setGidDivHeight();
    earth = top.LayerManagement.earth;
    var spaceParams = null;
    var projectId = top.SYSTEMPARAMS.project;
    StatisticsMgr.initPipelinePointLineList(projectId, $("#selLayers"));//初始化管线图层列表
    /**
     * 图层切换事件
     */
    $("#selFields").change(function () {
        var value = $("#selFields").val();
        if(value == clickValue){
            return;
        }
        clickValue = value;
        $("#divPipeLineTypeList").empty();
        $('#btnQueryValue').removeAttr("disabled");
        radioIsEnabled();
    });
    /**
     * 详细信息点击事件
     */
    $("#detailData").click(function (){
        var bShow  = $(this).attr("checked") == "checked";
        if(!bShow){
            top.LayerManagement.clearHtmlBalloons();
        }
        if(query){
            query.setShow(bShow);
        }
    });
    resetUi();
    /**
     * 切换图层时需要
     */
    function resetUi() {
        $("#selFields").empty();
        $("#divPipeLineTypeList").empty();
        $('#btnQueryValue').attr('disabled', 'disabled');
        $("#calculate").empty();
        radioIsEnabled();
    }

    /**
     * 清空列表数据
     * @return {[type]}   [description]
     */
    $("#selLayers").change(function () {
        resetUi();
    });
    /**
     * 获取字段列表
     * @return {[type]}     [description]
     */
    $("#btnGetField").click(function(){
        clickValue = null;
        resetUi();
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        getSelectFields(guid);
    });
    /**
     * 获取值域
     */
    $("#btnQueryValue").click(function () {
        var vv = $("#selFields option:selected");
        var fieldName = vv.val();
        getFieldValues(fieldName);
    });
    /**
     * 查询点击事件
     */
    $("#btnQuery").click(function () {
        earth.ShapeCreator.Clear();
        createQuery(null);
    });
    /**
     * 没有结果要销毁mscrollbar
     */
    var noResult = function(){
        if(lastResult){
            $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        }
        lastResult = false;
        $("#dg").datagrid({
            pagination:false
        });
        $('#dg').datagrid('loadData', { total: 0, rows: [] });
    };

    /**
     * 过滤条件
     * @returns {null}
     */
    var filter = function () {
        var strSQL = $.trim($("#calculate").val());
        if (strSQL.length < 2) {
            alert("非法查询语句，请修改");
            noResult();
            return;
        }
        var strArr = strSQL.split(" ");
        for(var m=0; m<strArr.length; m++){
            var thisStrArr = strArr[m].split("\'\'");
            if(thisStrArr.length > 1 && thisStrArr[0] && isNaN(thisStrArr[0])){
                noResult();
                alert("非法查询语句，请修改");
                return;
            }
        }
        var strPara = "";
        var key = 0;
        var andor = "and";
        for (var i = 0; i < strSQL.length; i++) {
            if (i + 2 < strSQL.length && (strSQL.substr(i, 2) == "or")) {
                var temp = strSQL.substr(key, i - 1 - key);
                var arrTemp = temp.split(' ');
                if (arrTemp.length != 3) {
                    noResult();
                    alert("非法查询语句，请修改！");
                    return;
                }
                var temp0 = arrTemp[0];
                if (temp0.length < 4 || !(temp0.substr(0, 2) == "''" && temp0.substr(temp0.length - 2, 2) == "''")) {
                    noResult();
                    alert("非法查询语句，请修改！");
                    return;
                }
                var bKey = true;
                for (var j = 0; j < mFieldList.length; j++) {
                    if (temp0.substr(2, temp0.length - 4) == mFieldList[j])
                        bKey = false;
                }
                if (bKey) {
                    noResult();
                    alert("关键字不在列表中！");
                    break;
                }
                var temp1 = arrTemp[1];
                if (!(temp1 == "=" || temp1 == ">" ||
                        temp1 == "<" || temp1 == ">=" ||
                        temp1 == "=<" || temp1 == "!="))
                    break;
                var temp2 = arrTemp[2];
                if (temp2.length < 2 || !(temp2.substr(0, 1) == "'" && temp2.substr(temp2.length - 1, 1) == "'")) {
                    noResult();
                    alert("非法查询语句，请修改！");
                    return;
                }
                key = i + 3;
                var aa = "";
                if (temp1 == "=") aa = "equal";
                else if (temp1 == ">") aa = "greater";
                else if (temp1 == "<") aa = "less";
                else if (temp1 == "=<") aa = "lessequal";
                else if (temp1 == ">=") aa = "greaterequal";
                else if (temp1 == "!=") aa = "unequal";

                strPara += "(" + andor + "," + aa + "," + temp0.substr(2, temp0.length - 4) + ",'" + temp2.substr(1, temp2.length - 2) + "')";
                andor = "or";
            } else if (i + 3 < strSQL.length && strSQL.substr(i, 3) == "and") {
                var temp = strSQL.substr(key, i - 1 - key);
                var arrTemp = temp.split(' ');
                if (arrTemp.length != 3) {
                    noResult();
                    alert("非法查询语句，请修改！");
                    return;
                }
                var temp0 = arrTemp[0];
                if (temp0.length < 4 || !(temp0.substr(0, 2) == "''" && temp0.substr(temp0.length - 2, 2) == "''")) {
                    noResult();
                    alert("非法查询语句，请修改！");
                    return;
                }
                var bKey = true;
                for (var j = 0; j < mFieldList.length; j++) {
                    if (temp0.substr(2, temp0.length - 4) == mFieldList[j])
                        bKey = false;
                }
                if (bKey) {
                    noResult();
                    alert("关键字不在列表中！");
                    break;
                }
                var temp1 = arrTemp[1];
                if (!(temp1 == "=" || temp1 == ">" ||
                        temp1 == "<" || temp1 == ">=" ||
                        temp1 == "=<" || temp1 == "!=")) {
                    noResult();
                    alert("非法查询语句，请修改！");
                    return;
                }
                var temp2 = arrTemp[2];
                var a = temp2.substr(0, 2);
                var b = temp2.substr(temp2.length - 2, 2);
                var c = temp2.substr(0, 1);
                var d = temp2.substr(temp2.length - 1, 1);
                 if (temp2.length < 2 || !(temp2.substr(0, 1) == "'" &&
                        temp2.substr(temp2.length - 1, 1) == "'")) {
                    noResult();
                    alert("非法查询语句，请修改！");
                    return;
                }
                key = i + 4;
                var aa = "";
                if (temp1 == "=") aa = "equal";
                else if (temp1 == ">") aa = "greater";
                else if (temp1 == "<") aa = "less";
                else if (temp1 == "=<") aa = "lessequal";
                else if (temp1 == ">=") aa = "greaterequal";
                else if (temp1 == "!=") aa = "unequal";

                strPara += "(" + andor + "," + aa + "," + temp0.substr(2, temp0.length - 4) + ",'" + temp2.substr(1, temp2.length - 2) + "')";
                andor = "and";
            }
        }
        if (key < strSQL.length) {
            var temp = strSQL.substr(key);
            var arrTemp = temp.split(' ');
            if (arrTemp.length != 3) {
                noResult();
                alert("非法查询语句，请修改！");
                return;
            }
            var temp0 = arrTemp[0];
            if (temp0.length < 4 || !(temp0.substr(0, 2) == "''" && temp0.substr(temp0.length - 2, 2) == "''")) {
                noResult();
                alert("非法查询语句，请修改！");
                return;
            }
            var bKey = true;
            for (var j = 0; j < mFieldList.length; j++) {
                if (temp0.substr(2, temp0.length - 4) == mFieldList[j])
                    bKey = false;
            }
            if (bKey) {
                noResult();
                alert("关键字不在列表中！");
                return;
            }
            var temp1 = arrTemp[1];
            if (!(temp1 == "=" || temp1 == ">" ||
                    temp1 == "<" || temp1 == ">=" ||
                    temp1 == "=<" || temp1 == "!=")) {
                noResult();
                alert("非法查询语句，请修改！");
                return;
            }
            var temp2 = arrTemp[2];
            try {
                if ((temp2.substr(0, 2) == "''") && (temp2.substr(temp2.length - 2, 2) == "''")
                        || temp2.length < 2 || !(temp2.substr(0, 1) == "'" &&
                        temp2.substr(temp2.length - 1, 1) == "'")) {
                    noResult();
                    alert("非法查询语句，请修改！");
                    return;
                }
                var aa = "";
                if (temp1 == "=") aa = "equal";
                else if (temp1 == ">") aa = "greater";
                else if (temp1 == "<") aa = "less";
                else if (temp1 == "=<") aa = "lessequal";
                else if (temp1 == ">=") aa = "greaterequal";
                else if (temp1 == "!=") aa = "unequal";

                strPara += "(" + andor + "," + aa + "," + temp0.substr(2, temp0.length - 4) + ",'" + temp2.substr(1, temp2.length - 2) + "')";
            } catch (e) {
                noResult();
                alert("非法查询语句，请修改！");

                return;
            }
        }
        return strPara;
    };
    /**
     * 查询函数
     * @param pFeat 查询的空间查询条件
     */
    var createQuery = function (pFeat) {
        var strPara = filter();
        if (strPara) {
            divload("tablediv");
            var bShow  = $("#detailData").attr("checked") == "checked";
            var vv = $("#selLayers option:selected");
            var guid = vv.val();
            var name = vv.text();
            var queryTableType = $("#selLayers").get(0).selectedIndex % 2 == 0 ? "1" : "0";
            //查询
            var header = ["US_KEY", "US_FEATURE"];
            var aliasHeader = ["编号", "类型"];
            query = Query.PageHelper(earth);
            query.setShow(bShow);
            setTimeout(function(){
                query.initParams([guid], [name, name], pFeat, strPara, 16, queryTableType, header, aliasHeader);
                spaceParams = pFeat;
                $("#detailData").attr("disabled", false);
                $("#importExcelBtn").attr("disabled", false);
            },100);
        }
    };
    /**
     * 多边形查询
     */
    $("#btnPolygonRegion").click(function () {
        earth.Event.OnCreateGeometry = onCreatePolygon;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreatePolygon();
    });
    /**
     * 画多边形回调函数
     */
    var onCreatePolygon = function (pFeat) {
        if (pFeat.Count < 3) {
            alert("无效的多边形");
            return false;
        }
        createQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    /**
     * 圆域查询
     */
    $("#btnCircleSelect").click(function () {
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

    $("#selFields").dblclick(function () {
        var value = $("#selFields").val();
        if(value == null){
            return;
        }
        $("#calculate").append("''" + value + "''");
    });
    /**
     * 字段双击事件
     */
    $("#divPipeLineTypeList").dblclick(function () {
        var value = $("#divPipeLineTypeList").val();
        $("#calculate").append("'" + value + "'");
        btnQueryEnabled();
    });
    /**
     * 大于等于等按钮点击事件
     */
    $("#eq").click(function () {
        $("#calculate").append(" " + "=" + " ");
    });
    $("#gt").click(function () {
        $("#calculate").append(" " + ">" + " ");
    });
    $("#lt").click(function () {
        $("#calculate").append(" " + "<" + " ");
    });
    $("#uneq").click(function () {
        $("#calculate").append(" " + "!=" + " ");
    });
    $("#gtOrEq").click(function () {
        $("#calculate").append(" " + ">=" + " ");
    });
    $("#ltOrEq").click(function () {
        $("#calculate").append(" " + "=<" + " ");
    });
    $("#And").click(function () {
        $("#calculate").append(" " + "and" + " ");
    });
    $("#Or").click(function () {
        $("#calculate").append(" " + "or" + " ");
    });
    $("#clearArea").click(function(){
        $("#calculate").text("");
    });

    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        $("#importResult>tbody").empty();
        var strPara = filter();
        if (strPara) {
            $("#importResult>tbody").empty();
            var vv = $("#selLayers option:selected");
            var guid = vv.val();
            var name = vv.text();
            var standardName=["INDEX","DISPLAYTYPE"];
            var queryTableType = $("#selLayers").get(0).selectedIndex % 2 == 0 ? 1 : 0;
            QueryObject.paramQueryALL(spaceParams, guid, strPara, 16, queryTableType,null,query.getTotalNum(),standardName);
            var tabObj = $("#importResult>tbody")[0];
            var columns = ["编号", "类型"];
            StatisticsMgr.importExcelByTable(tabObj, columns);
            if (earth.ShapeCreator != null) {
                earth.ShapeCreator.Clear();
                spaceParams = null;
            }
        }
    });
    $(window).unload(function () {
        if (earth.ShapeCreator != null) {
            earth.ShapeCreator.Clear();
        }
        if (query) {
            query.stopHighLight();
        }
        StatisticsMgr.detachShere();
    });
});
/**
 * 获取值域
 * @param fieldName 字段名称
 */
var getFieldValues = function (fieldName) {
    var vv = $("#selLayers option:selected");
    var guid = vv.val();
    $("#divPipeLineTypeList").empty();
    var layer = earth.LayerManager.GetLayerByGUID(guid);
    var layerCode = layer.PipelineType;
    var dataType = ($("#selLayers").get(0).selectedIndex % 2) == 0 ? "line" : "point";
    var mQueryString = layer.GISServer + "dataquery?service=" + guid + "&qt=256&fd=" + fieldName + "&qt=0&dt=" + dataType;
    query2(mQueryString, guid, layerCode);
};

var mFieldList = [];//数据库字段集合
/**
 * 发送异步请求，查询选择字段
 * @param queryURL
 */
var queryFields = function (queryURL) {
    earth.Event.OnEditDatabaseFinished = function(pRes, pFeature){
        if (pRes.ExcuteType == top.SystemSetting.excuteType){
            var xmlStr = pRes.AttributeName;
            var xmlDoc = top.loadXMLStr(xmlStr);
            var json = $.xml2json(xmlDoc);
            if (json == null || !json.MetaData) {
                return;
            }
            var field = json.MetaData.Table.Field;
            var dataType = ($("#selLayers").get(0).selectedIndex % 2) == 0 ? "line" : "point";
            var layer=earth.LayerManager.GetLayerByGUID($("#selLayers").val());
            //图层的编号 可以区分不同的管线类型 比方说排水与工业code就不同
            var intLayerCode = layer.PipeLineType;
                
            var lineType;
            var ptType;
            if(dataType=="line"){//管线
                
                lineType = top.getStandardName("US_LTTYPE", 1, true);
                ptType = top.getStandardName("US_PT_TYPE", 1, true);
            }else{
                lineType = top.getStandardName("US_LTTYPE", 0, true);
                ptType = top.getStandardName("US_PT_TYPE", 0, true);
            }
            //流向
            var flowdir = top.getName("US_FLOWDIR", 1, true);
            //压力
            var pressur=top.getName("US_PRESSUR",1,true);
            //电缆条数
            var ventnum=top.getName("US_VENTNUM",1,true);
            //总孔数
            var holeto=top.getName("US_HOLETOL",1,true);
            //已用孔数
            var holeused=top.getName("US_HOLEUSE",1,true);

            for (var i = 0; field && field.length && i < field.length; i++) {
                var strName = field[i].Name;//这个是数据库中的字段名称
                var strNameCase = strName.toUpperCase();//转为大写
                mFieldList.push(strName);
                var type = field[i].Type;
                if (strName == "OBJECTID" || strName == "SHAPE") continue;
                if(intLayerCode>=2000&&intLayerCode<3000&&strName==flowdir) continue;//"US_FLOWDIR"
                
                var captionName;
                if(dataType=="line"){//管线
                    captionName = top.getStandardName(strName, 1, false);
                    if(captionName){
                    var selected=(strName==lineType?"selected":"");
                        //燃气、热力、工业管线显示
                        if ((intLayerCode >= 5000 && intLayerCode < 6000)||(intLayerCode >= 6000 && intLayerCode < 7000)||(intLayerCode >= 7000 && intLayerCode < 8000)){//排除 流向字段 电缆条数 总孔数 已用孔数
                            if(strNameCase != flowdir &&  strNameCase != ventnum && strNameCase != holeto && strNameCase != holeused){
                                $("#selFields").append('<option value="' +
                                       strName + '" '+selected+'>' +
                                       captionName + '</option>');
                            }
                        }
                        
                        //排水和工业管道显示
                        else if (/*(*/intLayerCode >= 4000 && intLayerCode < 5000/*)||(intLayerCode >= 7000 && intLayerCode < 8000)*/){
                            //排除 压力 电缆条数 总孔数 已用孔数
                            if(strNameCase != pressur &&  strNameCase != ventnum && strNameCase != holeto && strNameCase != holeused){
                                $("#selFields").append('<option value="' +
                                       strName + '" '+selected+'>' +
                                       captionName + '</option>');
                            }
                            
                        }
                        //电力、电信
                        else if ((intLayerCode >= 1000 && intLayerCode < 2000)||(intLayerCode >= 2000 && intLayerCode < 3000)){
                            //排除 压力 电缆条数 总孔数 已用孔数
                            if(strNameCase != flowdir){
                                $("#selFields").append('<option value="' +
                                       strName + '" '+selected+'>' +
                                       captionName + '</option>');
                                
                            }
                        }
                        //给水
                        else if(intLayerCode >= 3000 && intLayerCode <= 3513){
                            //排除 压力 电缆条数 总孔数 已用孔数
                            if(strNameCase != pressur &&  strNameCase != ventnum && strNameCase != holeto && strNameCase != holeused){
                                $("#selFields").append('<option value="' +
                                       strName + '" '+selected+'>' +
                                       captionName + '</option>');
                            }
                        }
                    }
                }else{//管点
                   captionName = top.getStandardName(strName, 0, false);
                   if(captionName){
                        var selected=(strName==ptType?"selected":"");
                        $("#selFields").append('<option value="' +
                               strName + '" '+selected+'>' +
                               captionName + '</option>');
                   }
                }
            }
            $("#calculate").val("");
            btnQueryEnabled();
        }
    };
    earth.DatabaseManager.GetXml(queryURL);
};
/**
 * 发送异步请求，查询选择字段
 * @param queryURL
 */
var query2 = function (queryURL, layerId, layerCode) {
    earth.Event.OnEditDatabaseFinished = function(pRes, pFeature){
        if (pRes.ExcuteType == top.SystemSetting.excuteType){
            $("#loadImg").hide();
            $("#divPipeLineTypeList").css("visibility","visible")
            var xmlStr = pRes.AttributeName;
            var xmlDoc = top.loadXMLStr(xmlStr);
            var json = $.xml2json(xmlDoc);
            if (json == null || !json.ValueRangeResult) {
                return;
            }
            var nameCode = $("#selFields").val();
            var dataType = ($("#selLayers").get(0).selectedIndex % 2) == 0 ? "line" : "point";
            if(dataType === "line"){
                nameCode = top.getStandardName(nameCode, 1, true);
            }else{
                nameCode = top.getStandardName(nameCode, 0, true);
            }
            var nameType = "";
            if(nameCode == "US_ATTACHMENT"){
                nameType = "Attachment";
            }else if(nameCode == "US_PT_TYPE"){
                nameType = "PointType";
            }else if(nameCode == "US_PMATER"){
                nameType = "MaterialType";
            }else if(nameCode == "US_LTTYPE"){
                nameType = "LayoutType";
            }else if(nameCode == "US_LTYPE"){
                nameType = "LineType";
            }else if(nameCode == "US_PRESSUR"){
                nameType = "Pressure";
            }else if(nameCode == "US_STATUS"){
                nameType = "StatusType";
            }else if(nameCode == "US_OWNER"){
                nameType = "Ownership";
            }
            var values = json.ValueRangeResult.ValueRange.Value;
            //这里要判断一下 对于数字要处理为 "只保留小数点后三位 并四舍五入"
            if (typeof(values) == "string") {
                 if(Number(values) == 0 || !isNaN(Number(values))){
                    var eachNum;
                    if(nameCode == "US_SIZE" || nameCode == "US_ROAD" || nameCode == "US_LTTYPE" || nameCode == "US_LTYPE"){
                        eachNum = values;
                    }else{
                        eachNum = (Number(values)==0)?0:Number(values);
                    }
                    $("#divPipeLineTypeList").append('<option value="' +
                        eachNum + '" title="'+eachNum+'">' +
                        top.getCaptionByCustomValue(layerCode, nameType, eachNum) + '</option>');
                 }else{
                    if(nameCode == "US_BD_TIME"){
                        values = values.substring(0,10);
                        values = values.replace(/-/g,"/");
                    }
                    $("#divPipeLineTypeList").append('<option value="' +
                        values + '" title="'+values+'">' +
                        top.getCaptionByCustomValue(layerCode, nameType, values) + '</option>');
                 }
            } else if (values instanceof Array) {
                if(nameCode == "US_SIZE"){
                    var numArr = [];
                    for(var i = 0; i < values.length; i++){
                        var numObj = {};
                        if(values[i].indexOf('X') > -1){
                            numObj.NUM = Number(values[i].substring(0,values[i].indexOf('X')));
                            numObj.ONUM = values[i];
                        }else{
                            numObj.NUM = Number(values[i]);
                            numObj.ONUM = values[i];
                        }
                        numArr.push(numObj);
                    }
                    numArr.sort(function(a,b){
                        return (a.NUM > b.NUM)||(a.NUM == b.NUM && a.ONUM > b.ONUM) ? 1 : -1;
                    });
                    for(var i = 0; i < values.length; i++){
                        $("#divPipeLineTypeList").append('<option value="' +
                                numArr[i].ONUM + '" title="'+numArr[i].ONUM+'">' +
                                numArr[i].ONUM + '</option>');
                    }
                }else{
                    values.sort();
                    for(var i = 0; i < values.length;  i++){
                        //对于数字单独处理一下
                        if(values[i] != "" && (Number(values[i]) == 0 || !isNaN(Number(values[i])))){
                            var eachNum;
                            if(nameCode == "US_ROAD" || nameCode == "US_LTTYPE" || nameCode == "US_LTYPE"){
                                eachNum = values[i];
                            }else{
                                eachNum = (Number(values[i])==0)?0:Number(values[i]);
                            }
                            $("#divPipeLineTypeList").append('<option value="' +
                                eachNum + '" title="'+eachNum+'">' +
                                top.getCaptionByCustomValue(layerCode, nameType, eachNum) + '</option>');
                        }else{
                            if(nameCode == "US_BD_TIME"){
                                values[i] = values[i].substring(0,10);
                                values[i] = values[i].replace(/-/g,"/");
                            }
                            $("#divPipeLineTypeList").append('<option value="' +
                                values[i] + '" title="'+values[i]+'">' +
                                top.getCaptionByCustomValue(layerCode, nameType, values[i]) + '</option>');
                        }
                    }
                }
            }

            $("#divPipeLineTypeList").get(0).selectedIndex = 0;
            if ($.trim($("#calculate").val()) != "") {
                $("#btnQuery").attr("disabled", false);
                $("#btnCircleSelect").attr("disabled", false);
                $("#btnPolygonRegion").attr("disabled", false);
            } else {
                $("#btnQuery").attr("disabled", true);
                $("#btnCircleSelect").attr("disabled", true);
                $("#btnPolygonRegion").attr("disabled", true);
            }
        }
    };
    earth.DatabaseManager.GetXml(queryURL);
};
/**
 * 根据选择的字段来改变一些比较符号的状态
 */
var radioIsEnabled = function () {
    var type = $("#selFields").val();
    if(!type) return;
    var dataType = ($("#selLayers").get(0).selectedIndex % 2) == 0 ? "line" : "point";
    if(dataType === "line"){
        type = top.getStandardName(type, 1, true);
    }else{
        type = top.getStandardName(type, 0, true);
    }
    if (type =="US_KEY" || type==="US_ID" || type == "US_LTTYPE"||type=="US_FLOWDIR"||type=="US_PMATER"||type=="US_OWNER"||type=="US_STATE"||type=="US_UPDATE"||type=="US_PT_TYPE"||type=="US_ATTACHMENT"||type=="US_ROAD" || type=="US_WELL" || type=="US_WELL_ID" ){
        $("#eq").attr("checked", "checked");
        $("#gt").attr("disabled", true);
        $("#lt").attr("disabled", true);
        $("#gtOrEq").attr("disabled", true);
        $("#ltOrEq").attr("disabled", true);
    } else {
        $("#eq").attr("checked", "checked");
        $("#gt").attr("disabled", false);
        $("#lt").attr("disabled", false);
        $("#gtOrEq").attr("disabled", false);
        $("#ltOrEq").attr("disabled", false);
    }
    $("#eq").attr("disabled", false);
    $("#uneq").attr("disabled", false);
    $("#And").attr("disabled", false);
    $("#Or").attr("disabled", false);
};
/**
 * 获取图层的所有材质类型
 * @param guid  图层的GUID
 */
var getSelectFields = function (guid) {
    $("#selFields").empty();
    var layer = earth.LayerManager.GetLayerByGUID(guid);
    var dataType = ($("#selLayers").get(0).selectedIndex % 2) == 0 ? "line" : "point";
    var mQueryString = layer.GISServer + "dataquery?service=" + guid + "&qt=0&dt=" + dataType;
    queryFields(mQueryString);
};
/**
 * 改变按钮事件
 */
var btnQueryEnabled = function () {
    if ($.trim($("#calculate").val()) != "") {
        $("#btnQuery").attr("disabled", false);
        $("#btnCircleSelect").attr("disabled", false);
        $("#btnPolygonRegion").attr("disabled", false);
    } else {
        $("#btnQuery").attr("disabled", true);
        $("#btnCircleSelect").attr("disabled", true);
        $("#btnPolygonRegion").attr("disabled", true);
    }
};