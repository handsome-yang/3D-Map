/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：设施搜索
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/

/**
 * 屏蔽右键菜单
 */
document.oncontextmenu = function() {
    event.returnValue = false;
};
var earth =null;
var projectId = top.SYSTEMPARAMS.project;
var pipeLineLayers = top.LayerManagement.PIPELINELAYERS;
earth = top.LayerManagement.earth;;
var datum = top.SYSTEMPARAMS.pipeDatum;
var bufPolygon = null;
var bLine = true;
var bDist = true;
setDivHeight();

$(function () {
    $("#txtBufferDist").attr("disabled",true);

    $("#scrollParamDiv").mCustomScrollbar({});
    $("#lbItem").click(function(){
        document.getElementById("geo").style.display="block";
        document.getElementById("shadow").style.display="none";
    });
    var getAttach = function(){
        $("#valueRangeResultList").empty();
        var serviceName=$("#divPipeLineLayersList").val();
        var server=$("#divPipeLineLayersList").find("option:selected").attr("server");
        var dataType="point";
        var mFieldName=top.getName("US_ATTACHMENT",0,true);
        var strConn= server+"dataquery?service="+serviceName+"&qt=256&fd="+mFieldName+"&dt="+dataType;
        earth.Event.OnEditDatabaseFinished = function(pRes, pFeature){
            $("#queryBtn").attr("disabled",false);
            if (pRes.ExcuteType == top.SystemSetting.excuteType){
                var xmlStr = pRes.AttributeName;
                var xmlDoc=loadXMLStr(xmlStr);
                parseValueRangeResult(xmlDoc,serviceName);
            }else{
                $("#valueRangeResultList").html("查询结果不存在");
            }
        }
        earth.DatabaseManager.GetXml(strConn);
    };
   
    $("#divPipeLineLayersList").change(function () {
        $("#valueRangeResultList").empty();
        $("#txtBufferDist").attr("disabled",true);
        $("#txtBufferDist").val(0);
        btnAnalyzeEnabled();
    })
    StatisticsMgr.initPipelineSelectList(projectId, $("#divPipeLineLayersList"));//初始化管线图层列表
    getAttach();
    btnAnalyzeEnabled();
    // 绘制范围 按钮
    $("#selectBtn").click(function () {
        $("#tblResult>tbody").empty();
        if(lineObjArr.length>0){
            analysisShowResult(false,lineObjArr);
            $("#showResult").attr("checked",false);
        }
        earth.ShapeCreator.Clear();
        clearBuffer(0);
        earth.Event.OnCreateGeometry = onCreateCircle;
        earth.ShapeCreator.CreateCircle();
    });
    // 绘制范围 键盘事件
    $("#txtBufferDist").keyup(function (){
        btnAnalyzeEnabled();
        clearBuffer();
        var radius=$("#txtBufferDist").val();
        if(top.regExpValidation.test(radius)){
            bDist = true;
            if( $("#tblResult>tbody")[0].innerHTML){
                createBufferFromLine(mVec,radius,true);
                greenCircle();
            } else{
                createBufferFromLine(mVec,radius,true,true);
            }
        }
    });
    // 间隔 键盘事件
    $("#BufferDist").keyup(function (){
        btnAnalyzeEnabled();
        clearBuffer();
        var radius=parseFloat($("#txtBufferDist").val());
        createBufferFromLine(mVec,radius,true);
        greenCircle();
    });
    // 附属物
    $("#valueRangeResultList").click(function(){
        btnAnalyzeEnabled();
    });
    // 获取附属物
    $("#queryBtn").click(function(){
        $("#queryBtn").attr("disabled",true);
        $("#valueRangeResultList").empty();
        $("#txtBufferDist").val(0);
        $("#BufferDist").val(10);
        $("#tblResult>tbody").empty();
        $("#showResult").removeAttr("checked");
        $("#importExcelBtn").attr("disabled",true);
        $("#showResult").attr("disabled",true);
        $("#detailData").attr("disabled",true);
        clearBuffer();
        getAttach();
        btnAnalyzeEnabled();
    });
    // 分析
    $("#btnAnalyze").click(function (){
        if(lineObjArr.length>0){
            analysisShowResult(false,lineObjArr);
            $("#showResult").attr("checked",false);
        }
        lineObjArr = []  ;
        $("#showResult").removeAttr("checked");
        if(bufPolygon == null){
            return;
        }
        divload("tablediv");
        $("#tblResult>tbody").empty();
        var layeId=$("#divPipeLineLayersList").val();
        var layer=earth.LayerManager.GetLayerByGUID(layeId);
        var layerName=layer.Name;
        var server=$("#divPipeLineLayersList").find("option:selected").attr("server");
        var strParaAttr="";
        var US_ATTACHMENT=top.getName("US_ATTACHMENT",0,true);
        $("#valueRangeResultList input:checkbox[checked=checked]").each(function (i,v){
            strParaAttr += "(or,equal,"+US_ATTACHMENT+",";
            strParaAttr += $(v).val();
            strParaAttr += ")";
        });
        if (strParaAttr =="") return;
        var strParaSpat = "(3,0,";
        strParaSpat += $("#txtBufferDist").val() + ",";
        strParaSpat += mVec.X + "," + mVec.Y;
        strParaSpat += ")";
        var queryType=17;
        var dataType='point';
        var  conStr = server + "dataquery?service=" + layeId + "&qt=" + queryType.toString() + "&dt=" + dataType.toString();
        conStr=conStr+"&pc="+strParaAttr;
        conStr=conStr+"&sc="+strParaSpat;
        conStr=conStr+"&pg=0,100";
        earth.Event.OnEditDatabaseFinished = function(pRes, pFeature){
            if (pRes.ExcuteType == top.SystemSetting.excuteType){
                var xmlStr = pRes.AttributeName;
                var xmlDoc=loadXMLStr(xmlStr);
                parseResult(xmlDoc,layeId,layerName);
                if(""==$("#tblResult>tbody").text()){
                    alert("分析结果为空！");
                }
            }
            divloaded();
        }
        earth.DatabaseManager.GetXml(conStr);
    });
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function(){
        var tabObj = $("#tblResult>tbody")[0];
        var columns = ["编号","类型","距离"];
        StatisticsMgr.importExcelByTable(tabObj,columns);
    });
    //显示结果
    $("#showResult").click(function(){
        var checkTag=$('input:checkbox[name="showResult"]').is(":checked");
        analysisShowResult(checkTag,lineObjArr);
    });
    //显示详细信息
    $("#detailData").click(function(){
        bShow = $('input:checkbox[name="detailData"]').is(":checked");
        if(!bShow){
            top.LayerManagement.clearHtmlBalloons();
        }
    });
    $(window).unload(function (){
        var checkTag=$('input:checkbox[name="showResult"]').is(":checked");
        if(checkTag){
            analysisShowResult(false,lineObjArr);
        }
        StatisticsMgr.detachShere();
        clearBuffer();
        clearHighLight();
    });
});
/**
 * 清除生成的缓冲区对象
 */
var clearBuffer = function(tag){
    if (bufPolygon != null){
        earth.DetachObject(bufPolygon);
        bufPolygon = null;
    }
    for(var i=0;i<bufferArr.length;i++){
        earth.DetachObject(bufferArr[i]);
    }

    for(var s=0;s<bufferDisk.length;s++){
        earth.DetachObject(bufferDisk[s]);

    }
    bufferArr=[];
    bufferDisk=[];
};
var bufferArr =[];
var bufferDisk = [];
// 创建缓冲区
var createBufferFromLine = function (center,radius,bDist,fillcolorTag,lineColor) {
    if(bufferArr.length>0){
        for(var i=0;i<bufferArr.length;i++){
            bufferArr[i].BeginUpdate();
            bufferArr[i].FillStyle.FillColor = parseInt(0x00ffffff);
            bufferArr[i].EndUpdate();
        }
    }
    if(center!=null){
        var guid = earth.Factory.CreateGuid();
        bufPolygon = earth.Factory.CreateElementCircle(guid, "circle");
        var tran = bufPolygon.SphericalTransform;
        tran.SetLocationEx(center.X,center.Y,center.Z);
        bufPolygon.BeginUpdate();

        if(fillcolorTag){
            bufPolygon.FillStyle.FillColor = parseInt(0x2500FF00);
        }else{
            bufPolygon.FillStyle.FillColor = parseInt(0x00ffffff);
        }
        bufPolygon.Radius = radius;
        var fillstyle = bufPolygon.FillStyle;
        if(bDist){
            bufPolygon.LineStyle.LineColor = parseInt(0xccff0000);
        } else {
            if(lineColor){
                bufPolygon.LineStyle.LineColor = lineColor;
            }else{
                bufPolygon.LineStyle.LineColor =parseInt( 0xcc009900);
            }
        }
        bufPolygon.AltitudeType = 1;
        bufPolygon.EndUpdate();
        earth.AttachObject(bufPolygon);
        if(bDist){
            bufferArr.push(bufPolygon);
        } else {
            bufferDisk.push(bufPolygon);
        }
    }
};
/**
 *创建点回调函数，根据点位置初始化输入框
 */
var mVec=null;
var mVecXYZ = null;
var onCreateCircle = function (pObj) {
    earth.ShapeCreator.Clear();
    $("#txtBufferDist").val(pObj.Radius.toFixed(2));
    $("#txtBufferDist").attr("disabled",false);
    var radius=parseFloat($("#txtBufferDist").val());
    var radius1=parseFloat($("#BufferDist").val());
    if(isNaN(radius)&&isNaN(radius1)){
        alert("请把半径设为数字");
    }
    mVec=earth.Factory.CreateVector3();
    mVec.X=pObj.Longitude;
    mVec.Y=pObj.Latitude;
    mVec.Z=pObj.Altitude;
    mVecXYZ = datum.des_BLH_to_src_xy(mVec.X,mVec.Y,mVec.Z);
    createBufferFromLine(mVec,radius,true,true);
    btnAnalyzeEnabled();
};
// 选择区域颜色
var greenCircle = function(){
    var radius0=parseFloat($("#txtBufferDist").val());
    var radius1=parseFloat($("#BufferDist").val());
    var circleCount = parseInt(radius0/radius1);
    if(radius0<radius1){

    } else{
        bDist =false;
        for(var i=0;i<circleCount;i++){
            var bGreen = i%2==0?parseInt( 0xcc009900):parseInt(0xccffff00);
            var radius = radius1*(i+1);
            createBufferFromLine(mVec,radius,false,null,bGreen);
        }
    }


}
/**
 * 在搜索的结果集中根据key值确定具体的对象
 * @param searchResult  搜索结果集
 * @param key           对象的US_KEY值
 * @return {*}          返回匹配的对象
 */
var filterByKey = function(searchResult, key){
    var obj = null;
    if (searchResult.RecordCount === 0){
        return null;
    }
    searchResult.GotoPage(0);
    for (var i = 0; i < searchResult.RecordCount; i++){
        obj = searchResult.GetLocalObject(i);
        if (null == obj) continue;
        if (obj.GetKey() == key){
            obj.Underground = true;
            return obj;
        }
    }
    return null;
};
/**
 * 高亮闪烁显示
 * 作为表格的行的双击事件处理函数，其可见范围需在window全局作用域！
 * @param layerID  图层ID
 * @param type     对象类型：point / line
 * @param guid     对象的GUID
 * @param key      对象的US_KEY值
 */
var lineObjArrFromSh = [];
window.highlightObject = function (layerID, type, guid, key) {
    var layer = earth.LayerManager.GetLayerByGUID(layerID);
    var i = 0;
    var subLayer = null;
    var searchResult = null;
    var obj = null;
    for (i = 0; i < layer.GetChildCount(); i++) {
        subLayer = layer.GetChildAt(i);
        if (type === "point") {
            if (subLayer.LayerType === "Container") continue;
        } else if (type === "line") {
            if (subLayer.LayerType !== "Container") continue;
        }

        var dt = subLayer.LocalSearchParameter.ReturnDataType;
        subLayer.LocalSearchParameter.ClearSpatialFilter();
        
        subLayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml;
        subLayer.LocalSearchParameter.PageRecordCount = 100;
        subLayer.LocalSearchParameter.SetFilter(key, "");
        
        subLayer.LocalSearchParameter.HasDetail = false;
        subLayer.LocalSearchParameter.HasMesh = false;
        searchResult = subLayer.SearchFromLocal();
        subLayer.LocalSearchParameter.ReturnDataType = dt;

        if (searchResult.RecordCount < 1) continue;
        subLayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml;
        obj = filterByKey(searchResult, key);
        subLayer.LocalSearchParameter.ReturnDataType = dt;
        if (obj != null) {
            var vecCenter = obj.SphericalTransform;
            earth.GlobeObserver.GotoLookat(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude+50, 0.0, 89.0, 0, 4);
            obj.ShowHighLight();
            lineObjArrFromSh.push(obj);
            return;
        }
    }
    if (obj == null&&type === "point") {
        StatisticsMgr.sphereGotoLookat(guid, subLayer, layerID, key);
    }
};

/**
 * 解析查询结果，添加到结果表格中
 * @param result 查询结果
 * @param guid 图层ID
 * @param name 图层名
 */
var  lineObjArr = [];
var parseResult = function (result, guid, name) {
    $("#dgDiv thead").show();
    var template = '<tr ondblclick=analysisHighlightObject("$LayerID","$TYPE","$GUID","$KEY")' +
        '><td class="col">$INDEX</td><td class="col">$DISPLAYTYPE</td><td class="col">$DISTANCE</td></tr>';
    var json = $.xml2json(result);
    if(json==null||!json.Result){
        return;
    }
    var type = json.Result.geometry;
    var displayType = type === "point" ? "管点" : "管线";
    type=type === "point"?"point":"line";
    var records = json.Result.Record;
    var layerObj = earth.LayerManager.GetLayerByGUID(guid);
    var layerCode = layerObj.PipeLineType;
    if (json.Result.num <= 0) {
        return;
    } else if (json.Result.num == 1) {
        greenCircle();
        var valueRangeResult1 = records[top.getName("US_ATTACHMENT",0,true)];
        lineObjArr.push({layerId:guid,type:type,guid:records[top.getName("US_ID",0,true)],key:records[top.getName("US_KEY",0,true)]});
        var distance = 0;
        var Coordinates = records.SHAPE.Point.OriginalCoordinates;
        var coord = Coordinates.split(" ");
        var coordinate1 = coord[0].split(",");
        if(coordinate1.length > 2){
            distance = parseFloat(Math.sqrt((coordinate1[0]-mVecXYZ.X)*(coordinate1[0]-mVecXYZ.X) + (coordinate1[1]-mVecXYZ.Y)*(coordinate1[1]-mVecXYZ.Y))).toFixed(3);
        }

        $("#tblResult>tbody").append(template.replace("$INDEX", records[top.getName("US_KEY",0,true)])
            .replace("$DISPLAYTYPE", top.getCaptionByCustomValue(layerCode, "Attachment", valueRangeResult1))
            .replace("$LayerID", guid)
            .replace("$TYPE", type)
            .replace("$GUID", records[top.getName("US_ID",0,true)])
            .replace("$KEY", records[top.getName("US_KEY",0,true)])
            .replace("$DISTANCE",distance));
    } else {
        greenCircle();
        for(var i = 0; i < records.length; i++){
            var distance = 0;
            var Coordinates = records[i].SHAPE.Point.OriginalCoordinates;
            var coord = Coordinates.split(" ");
            var coordinate1 = coord[0].split(",");
            if(coordinate1.length > 2){
                distance = parseFloat(Math.sqrt((coordinate1[0]-mVecXYZ.X)*(coordinate1[0]-mVecXYZ.X) + (coordinate1[1]-mVecXYZ.Y)*(coordinate1[1]-mVecXYZ.Y))).toFixed(3);
            }
            records[i].distance = distance;
        }
        records.sort(function(a, b){
            return parseFloat(a.distance) > parseFloat(b.distance) ? 1 : -1;
        });

        for (var i = 0; i < records.length; i++) {
            lineObjArr.push({layerId:guid,type:type,guid:records[i][top.getName("US_ID",0,true)],key:records[i][top.getName("US_KEY",0,true)]});
            var valueRangeResult1 = records[i][top.getName("US_ATTACHMENT",0,true)];
            $("#tblResult>tbody").append(template.replace("$INDEX", records[i][top.getName("US_KEY",0,true)])
                .replace("$DISPLAYTYPE", top.getCaptionByCustomValue(layerCode, "Attachment", valueRangeResult1))
                .replace("$LayerID", guid)
                .replace("$TYPE", type)
                .replace("$GUID", records[i][top.getName("US_ID",0,true)])
                .replace("$KEY", records[i][top.getName("US_KEY",0,true)])
                .replace("$DISTANCE", records[i].distance));
        }
    }
    $("#tblResult").resize();
    $("#importExcelBtn").attr("disabled",false);
    $("#showResult").attr("disabled", false);
    $("#detailData").attr("disabled", false);
};
var isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};
/**
 *解析从服务器返回数据,插入valueRangeResultList
 */
function parseValueRangeResult(data,layerId){
    var json = $.xml2json(data);
    if(json==null||!json.ValueRangeResult){
        $("#valueRangeResultList").html("查询结果不存在");
        return;
    }
    var cLayer = earth.LayerManager.GetLayerByGUID(layerId);
    var layerCode = cLayer.PipeLineType;
    var valueRangeResult=json.ValueRangeResult.ValueRange.Value;
    $("#valueRangeResultList").children().remove();
    if(isArray(valueRangeResult)){
        for(var i=0;i<valueRangeResult.length;i++){
            if(valueRangeResult[i]!=0){
                $("#valueRangeResultList").append('<div style="padding: 3px 0"><label><input type="checkbox" value="' +
                    valueRangeResult[i]+'">' +
                    top.getCaptionByCustomValue(layerCode, "Attachment", valueRangeResult[i]) + '</label></div>');
            }
        }
    }else if(valueRangeResult){
        $("#valueRangeResultList").append('<div><label><input type="checkbox" value="' +
            valueRangeResult+'">' +
            top.getCaptionByCustomValue(layerCode, "Attachment", valueRangeResult) + '</label></div>');
    }


    if( $("#valueRangeResultList").children().length>0){
        $("#selectDiv").removeAttr("disabled");
    }else{
        $("#selectDiv").attr("disabled","disabled");
    }
}
// 分析按钮是否可点击
var btnAnalyzeEnabled=function(){
    var length=($("#valueRangeResultList input:checkbox[checked=checked]")).length;
    var value1 =  $("#txtBufferDist").val();
    var value2 =  $("#BufferDist").val();
    if(length>0 &&top.regExpValidation.test(value1)&&top.regExpValidation.test(value2)){
        $("#btnAnalyze").attr("disabled",false);
    }else{
        $("#btnAnalyze").attr("disabled",true);
    }
};
