/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：缓冲查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var query;

$("#detailData").click(function (){
    var bShow  = $(this).attr("checked") == "checked";
    if(!bShow){
        top.LayerManagement.clearHtmlBalloons();
    }
    if(query){
        query.setShow(bShow);
    }
});
$(function () {
    var highLightObjs = [];
    setGidDivHeight();
    earth = top.LayerManagement.earth;
    var selectedObj =null;
    var bufPolygon = null;
    var bufGeoPoints = null;
    var projectId = top.SYSTEMPARAMS.project;
    StatisticsMgr.initPipelineList(projectId, $("#divPipeLineLayersList"));//初始化管线图层列表;
    $("#scrollDiv").mCustomScrollbar({});
    $("#txtBufferDist").attr("disabled",true);
    var lineObjArr = [];
    $("#btnSelectAll").click(function () {
        $("#divPipeLineLayersList input:checkbox").attr("checked", "checked");
        btnAnalyzeEnabled();
    });
    $("#btnSelectNone").click(function () {
        $("#divPipeLineLayersList input:checkbox").removeAttr("checked");
        btnAnalyzeEnabled();
    });
    $("#btnSelectReverse").click(function () {
        $.each($("#divPipeLineLayersList input:checkbox"), function (i, v) {
            var vv = $(v);
            if (vv.attr("checked")) {
                vv.removeAttr("checked");
            } else {
                vv.attr("checked", "checked");
            }
        });
        btnAnalyzeEnabled();
    });
    $("#divPipeLineLayersList").click(function () {
        btnAnalyzeEnabled();
    });
    var btnAnalyzeEnabled = function () {
        var length = ($("#divPipeLineLayersList input:checkbox[checked=checked]")).length;
        var value = $("#txtObjId").val();
        var r=$("#txtBufferDist").val();
        if ((length > 0) && value&&top.regExpValidation.test(r)) {
            $("#btnAnalyze").attr("disabled", false);
        } else {
            $("#btnAnalyze").attr("disabled", true);
        }
        if(length > 0){
            $("#txtBufferDist").attr("disabled",false);
        }else{
            $("#txtBufferDist").attr("disabled",true);
        }
        if(top.regExpValidation.test(r)){
            $("#btnSelectObject").attr("disabled", false);
        }else{
            $("#btnSelectObject").attr("disabled", true);
        }
    };
    /**
     * 清除生成的缓冲区对象
     */
    var clearBuffer = function () {
        if (bufPolygon != null) {
            earth.DetachObject(bufPolygon);
            bufPolygon = null;
        }
        if (bufferByBuffer != null) {
            for(var i=0;i<bufferByBuffer.length;i++){
                earth.DetachObject(bufferByBuffer[i]);
            }
            bufferByBuffer = [];
        }
    };
    /**
     * 选取
     */
    var keyDownOrClick = false;
    $("#btnSelectObject").click(function () {
        if(keyDownOrClick){
            $("#txtObjId").empty();
        }
        clearBuffer();
        bufferArrToPoint = [];
        keyDownOrClick = true;
        earth.focus();
        earth.Event.OnPickObjectEx = onPickObjectEx;
        earth.Query.PickObjectEx(24);  // SEPickObjectType.PickAllObject
        document.onkeydown=function(event){
            event = event || window.event;
            var keyCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
            if(keyCode == 16){
                keyDownOrClick = false;
                earth.Event.OnPickObjectEx = onPickObjectEx;
                earth.Query.PickObjectEx(12);
            }
        }
        document.onkeyup=function(event){
            event = event || window.event;
            var keyCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
            if(keyCode == 16){
                keyDownOrClick = true;
                earth.Event.OnPickObjectEx = function () {
                };
                earth.ToolManager.SphericalObjectEditTool.Browse();
            }
        }
    });
    var stopHighLight = function(){
        if(highLightObjs && highLightObjs.length > 0){
            for(var i = 0; i < highLightObjs.length; i++){
                var obj = highLightObjs[i];
                obj.StopHighLight();
            }
        }
        highLightObjs = [];
    };
    /**
     * pick事件
     * @param pObj
     */
    var isLine=true;
    var pointCoords=null;
    var pointArr = [];
    var spt =null;
    var ept =null;
    var onPickObjectEx = function (pObj) {
        //停止高亮
        stopHighLight();
        var objKey=pObj.GetKey();
        pObj.Underground = true;  // SEObjectFlagType.ObjectFlagUnderground
        earth.Event.OnPickObjectEx = function () {
        };
        earth.Query.FinishPick();
        pObj.ShowHighLight();
        highLightObjs.push(pObj);
        var parentLayerNameTemp = pObj.GetParentLayerName();
        var parentLayerName = parentLayerNameTemp.split("=")[1];
        var layerType = parentLayerNameTemp.split("_")[1];
        var str=parentLayerNameTemp.split("=")[1].split("_");
        var PObjGUID = str[0];
        var layer = earth.LayerManager.GetLayerByGUID(PObjGUID);
        var subLayer = null;
        for(var i= 0, len=layer.GetChildCount(); i<len; i++){
            subLayer = layer.GetChildAt(i);
            if(subLayer.Name == str[1]){  // 使用具体的_container图层
                break;
            }
        }
        if(subLayer == null){
            return;
        }
        var param = subLayer.QueryParameter;
        if(param==null){
            alert("查询不到结果");
            return;
        }
        param.ClearRanges();
        param.ClearCompoundCondition();
        param.ClearSpatialFilter();
        var result = null, json = null;

        var fieldName;
        if(layerType === "container"){//管线
            fieldName = top.getName("US_KEY", 1, true);
        }else{
            fieldName = top.getName("US_KEY", 0, true);
        }

        param.Filter = "(and,equal," + fieldName + "," + objKey + ")";
        param.QueryType = 17;  // SE_SpatialData
        if (parentLayerName.indexOf("container") > -1) {

         // line RecordCount = 1
            param.QueryTableType = 1;
            result = subLayer.SearchFromGISServer();
            if (result.RecordCount > 0) {
                json = $.xml2json(result.GotoPage(0));
                if (json.Result.num == 1) {
                    var selectedObjStr = json.Result.Record.SHAPE;
                    var coords = selectedObjStr.Polyline.Coordinates.split(",");
                     spt = json.Result.Record.US_SPT_KEY;
                     ept = json.Result.Record.US_EPT_KEY;
                    selectedObj =  earth.Factory.CreateGeoPoints();
                    for (var i = 0; i < coords.length; i += 3) {
                        selectedObj.Add(coords[i], coords[i + 1], coords[i + 2]);
                    }
                    isLine=true;
                    if(keyDownOrClick){
                        $("#txtObjId").val(objKey);
                    } else{
                        $("#txtObjId").val(objKey);
                    }

                    btnAnalyzeEnabled();
                    
                    createBufferFromLine(selectedObj,spt,ept);
                }else{
                    alert("管线编码不唯一");
                }
            }else{
                alert("查询管线不在当前工程");
                return;
            }
        } else {  // point
            param.QueryTableType = 0;
            result = subLayer.SearchFromGISServer();
            if (result.RecordCount > 0) {
                json = $.xml2json(result.GotoPage(0));
                if (json.Result.num == 1) {
                    var selectedObjStr = json.Result.Record.SHAPE;
                    pointCoords = selectedObjStr.Point.Coordinates.split(",");
                    bufGeoPoints=createBufferFromCircle(pointCoords);
                    isLine=false;
                    if(keyDownOrClick){
                        $("#txtObjId").val(objKey);
                    } else{
                           $("#txtObjId").val(objKey);
                    }
                    btnAnalyzeEnabled();
                }else{
                    alert("管点编码不唯一!");
                }
            }
        }
    };

    var createBufferFromCircle = function (coords) {
        var tempBufGeoPoints = earth.Factory.CreateGeoPoints();
        clearBuffer();
        var guid = earth.Factory.CreateGuid();
        bufPolygon = earth.Factory.CreateElementCircle(guid, "");
        var tran = bufPolygon.SphericalTransform;
        var thisAltitude = earth.Measure.MeasureTerrainAltitude(coords[0], coords[1]);
        tran.SetLocationEx(coords[0],coords[1],thisAltitude);
        bufPolygon.BeginUpdate();

        bufPolygon.Radius=$("#txtBufferDist").val();
        bufPolygon.LineStyle.LineWidth = 1;
        bufPolygon.LineStyle.LineColor = parseInt("0xFFFF0000");
        bufPolygon.FillStyle.FillColor = parseInt("0x2500FF00");
        bufPolygon.AltitudeType = 1;   // SEAltitudeType.ClampToTerrain
        bufPolygon.EndUpdate();
        earth.AttachObject(bufPolygon);

        var vecs = earth.GeometryAlgorithm.CreatePolygonFromCircle($("#txtBufferDist").val(), 24);
        for(var i=0;i<vecs.Count;i++){
            var vec = tran.TransformCartesionToSphrerical(vecs.Items(i));
            tempBufGeoPoints.Add(vec.X, vec.Y, vec.Z);
        }
        bufGeoPoints=tempBufGeoPoints;
        return tempBufGeoPoints;
    };
    var bufferArrToPoint = [];
    var createBufferFromLine = function (selectedObj,spt,ept) {
        //clearBuffer();
        var vec3s = earth.Factory.CreateVector3s();
        var pt = null;
        bufGeoPoints = earth.GeometryAlgorithm.CreatePolygonBufferFromPolyline(selectedObj, $("#txtBufferDist").val(), 0, 36);

        for (var i = 0; i < bufGeoPoints.Count; i++) {
            pt = bufGeoPoints.GetPointAt(i);
            vec3s.Add(pt.Longitude, pt.Latitude, pt.Altitude);
        }
        var bufPoly = earth.Factory.CreateElementPolygon(earth.Factory.CreateGUID(), "");
        bufPoly.BeginUpdate();
        bufPoly.SetExteriorRing(vec3s);   // SECoordinateUnit.Degree
        bufPoly.LineStyle.LineWidth = 1;
        bufPoly.LineStyle.LineColor = parseInt("0xFFFF0000");
        bufPoly.FillStyle.FillColor = parseInt("0x2500FF00");
        bufPoly.AltitudeType = 1;   // SEAltitudeType.ClampToTerrain
        bufPoly.EndUpdate();
        btnAnalyzeEnabled();
        checkArrFromBuffer(bufPoly,spt,ept);
    };
    function checkArrFromBuffer(bufPolygon,spt,ept){
        if(bufferArrToPoint.length<1){
            bufferArrToPoint.push([{
                s:spt,
                e:ept,
                buffer:bufPolygon.getPolygon()
            }]);
        } else{
            var tag = true;
            for(var s=0;s<bufferArrToPoint.length;s++){
                for(var k=0;k<bufferArrToPoint[s].length;k++){
                    var relationship= earth.PolygonAlgorithm.PolysRelationship(bufferArrToPoint[s][k].buffer,bufPolygon.getPolygon());
                    if(relationship === 3){
                        bufferArrToPoint[s].push({
                            s:spt,
                            e:ept,
                            buffer:bufPolygon.getPolygon()
                        });
                        tag = false;
                        break;
                    }
                }
            }
            if(tag){
                bufferArrToPoint.push([{
                    s:spt,
                    e:ept,
                    buffer:bufPolygon.getPolygon()
                }]);
            }
        }
        clearBuffer();
        for(var m=0;m<bufferArrToPoint.length;m++){
             if(bufferArrToPoint[m].length>1){
               var seopolygon=earth.PolygonAlgorithm.PolysBoolOperation(bufferArrToPoint[m][0].buffer,bufferArrToPoint[m][1].buffer,1);
               for(var j=2;j<bufferArrToPoint[m].length;j++){
                   seopolygon=earth.PolygonAlgorithm.PolysBoolOperation(seopolygon.Items(0),bufferArrToPoint[m][j].buffer,1);
               }
                 createPolygonByBuffer(seopolygon.Items(0));
             }else{
                 createPolygonByBuffer(bufferArrToPoint[m][0].buffer)
             }
        }
    }
    var bufferByBuffer = [];
    function createPolygonByBuffer(seopolygon){
        var bufPoly = earth.Factory.CreateElementPolygon(earth.Factory.CreateGUID(), "");
        bufPoly.BeginUpdate();
        bufPoly.SetPolygon(seopolygon);   // SECoordinateUnit.Degree
        bufPoly.LineStyle.LineWidth = 1;
        bufPoly.LineStyle.LineColor = parseInt("0xFFFF0000");
        bufPoly.FillStyle.FillColor = parseInt("0x2500FF00");
        bufPoly.AltitudeType = 1;   // SEAltitudeType.ClampToTerrain
        bufPoly.EndUpdate();
        earth.AttachObject(bufPoly);
        bufferByBuffer.push(bufPoly);
        bufGeoPoints =  earth.Factory.CreateGeoPoints();

         var vec3s  = bufPoly.GetExteriorRing ();
        for (var i = 0; i < vec3s.Count; i++) {
            var pt = vec3s.Items(i);
            bufGeoPoints.Add(pt.X, pt.Y, pt.Z);
        }
    }
    $("#txtBufferDist").keyup(function () {
        checkNum($("#txtBufferDist")[0], true, 2, 10000);
        var value = $("#txtBufferDist").val();
        btnAnalyzeEnabled();
        if(value>0){
            $("#btnSelectObject").attr("disabled", false);
            clearBuffer();
            bufferArrToPoint = [];
            if(isLine){
                if(selectedObj){
                    createBufferFromLine(selectedObj,spt,ept);
                }
            }else{
                bufGeoPoints=createBufferFromCircle(pointCoords);  
            }
        }else{
            $("#btnSelectObject").attr("disabled", true);
        }
    });
    $("#btnAnalyze").click(function () {
        divload("tablediv");
        lineObjArr = [];
        $("#showResult").removeAttr("checked");
        if (bufferByBuffer == null) {
            return;
        }
        var queryTableType = [1, 0];
        var ids = [];
        var names = [];
        $("#divPipeLineLayersList input:checkbox[checked=checked]").each(function (i, v) {
            var guid = $(v).val();
            var name = $(v).next().text();
            ids.push(guid);
            names.push(name, name);
        });
        var bShow  = $("#detailData").attr("checked") == "checked";
        //查询
        var header = ["US_KEY", "US_FEATURE", "layerName"];
        var aliasHeader = ["编号", "类型", "图层"];
         /*
         经调试发现,此方法采取顺序执行 反复递归时会导致IE未响应卡住，且后台查询方法为直接获取数据不是异步故采用延时器加遮罩层的形式增加用户体验
         */
        setTimeout(function(){    
        query = Query.PageHelper(earth);
        query.setShow(bShow);
        query.initParams(ids, names, bufGeoPoints, null, 16, queryTableType, header, aliasHeader);
        $("#detailData").attr("disabled", false);
        divloaded();
        },100); 
    });
    /**
     * 功能：【导出Excel】按钮onclick事件  RLA142RLA140
     */
    $("#importExcelBtn").click(function () {
        $("#importResult>tbody").empty();
        var standardName=["INDEX","DISPLAYTYPE","LAYER"];
        $("#divPipeLineLayersList input:checkbox[checked=checked]").each(function (i, v) {
            var guid = $(v).val();
            var queryTableType = [1, 0];
            for (var q = 0; q < queryTableType.length; q++) {
                QueryObject.paramQueryALL(bufGeoPoints, guid, null, 16, queryTableType[q], null,query.getTotalNum(),standardName);
            }
        });
        var tabObj = $("#importResult>tbody")[0];
        var columns = ["编号", "类型", "图层"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    $(window).unload(function () {
        clearBuffer();
        //关闭页面的时候关闭所有管线的闪烁
        if(query){
            query.stopHighLight(); 
        } 
        stopHighLight();
        StatisticsMgr.detachShere();
    });
});