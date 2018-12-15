/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：红线分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
$(function () {
    var earth = top.LayerManagement.earth;//parent.earth;
    var projManager = top.projManager;
    var node = top.selNode;
    var roadlineLayerId = null;
    var highLightObjArr = [];
    var lineBufferInEarth = [];
    var isShowRoad = true;      //保存打开该面板前审批树中道路红线结点的勾选状态
    var isParamModel = projManager.getParamModelVisibility();
    var selectedRoadLineGuid=null;

    //布局
    setGidOuterDivHeight();

    //初始化
    var init = function(){
      if(!node) {
            alert("请先选择一个方案才能进行红线分析");
            return;
        }

        if(node&&node.type=="PLAN"){
            roadlineLayerId=node.roadLine;
            $("#btnSelectRoad").removeAttr("disabled");
            $("#rdoSelectRoad").attr("disabled",false);
            $("#rdoAllRoad").attr("disabled",false);
        }else{
            $("#btnSelectRoad").attr("disabled",true);
            $("#btnAnalysis").attr("disabled",true);
            $("#rdoSelectRoad").attr("disabled",true);
            $("#rdoAllRoad").attr("disabled",true);
        }

        isShowRoad = getRoadState();
        if(!isShowRoad){
            setRoadState(true);
        }

        projManager.showParamModel(node.id, true);
    }

    init();
    // 创建点集合对象，并返回这个对象
    var getGeoPointsFromSEVector3s = function (vec3s) {
        var geoPoints = earth.Factory.CreateGeoPoints();
        for (var i = 0; i < vec3s.Count; ++i) {
            geoPoints.Add(vec3s.Items(i).X, vec3s.Items(i).Y, vec3s.Items(i).Z);
        }
        return geoPoints;
    };
    // 创建三维矢量集合对象，并返回这个对象
    var getSEVector3sFromGeoPoints = function (points) {
        var vPoints = earth.Factory.CreateVector3s();
        for (var i = 0; i < points.Count; ++i) {
            var point = points.GetPointAt(i);
            vPoints.Add(point.Longitude, point.Latitude, point.Altitude);
        }
        return vPoints;
    };
    /**
     * 获取沿线一定距离的缓冲区多边形范围
     * @param lineObj  SEElementLine
     * @param distance 缓冲距离
     * @return {*} 缓冲多边形
     */
    var getBufferOfLine = function (lineObj, distance) {
        var polygon = null;
        if (lineObj && distance) {
            var tmpVecs = lineObj.GetPointArray();
            var tmpPoints = getGeoPointsFromSEVector3s(tmpVecs);
            var points = earth.GeometryAlgorithm.CreatePolygonFromPolylineAndWidth(tmpPoints, distance, distance);

            if (points.Count > 0) {
                polygon = earth.Factory.CreatePolygon();
                polygon.AddRing(getSEVector3sFromGeoPoints(points));
            }
        }

        return polygon;
    };

    $("input:radio").change(function () {
        if ($(this).val() == 0) {
            $("#rdoAllRoad").removeAttr("checked");
            $("#btnSelectRoad").removeAttr("disabled");
            $("#btnAnalysis").attr("disabled",true);
            $("#txtDist").removeAttr("disabled");
        } else {
            $("#txtDist").val("0");
            $("#txtDist").attr("disabled", "disabled");
            $("#rdoSelectRoad").removeAttr("checked");
            $("#btnSelectRoad").attr("disabled", "disabled");
            $("#btnAnalysis").removeAttr("disabled");
        }

        clearAll();
    });


    //清除高亮
    var stopHightLight = function () {
        if (highLightObjArr.length) {
            for (var i = 0; i < highLightObjArr.length; i++) {
                var obj = highLightObjArr[i];
                try {
                    if (obj) {
                        obj.StopHighLight();
                    }
                } catch (e) {

                }
            }
            highLightObjArr = [];
        }
    }

    //清除缓冲区
    var clearBoxes = function () {
        $.each(lineBufferInEarth, function (i, line) {
            earth.DetachObject(line);
        });
        lineBufferInEarth = [];
    };

    $("#btnSelectRoad").click(function () {
        clearBoxes();
        earth.Event.OnSelectChanged = onSelectChanged;
        earth.ShapeCreator.Clear();
        earth.ToolManager.SphericalObjectEditTool.Select();
    });
    
    /*
     *选取红线改变事件
     */
    var onSelectChanged = function () {
        var projId = node.projectId;
        var lineObjList=lineDistanceObj(projId);
        var nSelectCount = earth.SelectSet.GetCount();
        var getEditLayers = top.editLayers;
        var roadLineLayer = getEditLayers[roadlineLayerId];
        if (!roadLineLayer)return;
        if (nSelectCount == 1) {
            var lineobj = earth.SelectSet.GetObject(0);
            var eObj = roadLineLayer.GetObjByGuid(lineobj.Guid);
            if (eObj&&lineobj.Rtti==220) {
                $("#btnAnalysis").removeAttr("disabled");
                selectedRoadLineGuid=lineobj.Guid;
                var guid = lineobj.Guid;
                var dist = lineObjList[guid];
                if(dist){
                    var distance = dist["CPROADLINE.DISTANCE"];
                    $("#txtDist").val(distance);
                }
                earth.Environment.SetHighlightColor(parseInt("0xFFFFFF00"));
                lineobj.ShowHighLight();
            }else {
                alert("选中的对象不是道路红线，或不属于当前方案，请重新选择.");
                earth.SelectSet.Clear();
                $("#txtDist").val("0");
                $("#btnAnalysis").attr("disabled",true);
            }
        }else if (nSelectCount > 1) {
            var i = 0;
            var lineobj = undefined;
            var eObj = undefined;
            for (i = 0; i < nSelectCount; i++) {
                lineobj = earth.SelectSet.GetObject(i);
                eObj = roadLineLayer.GetObjByGuid(lineobj.Guid);
                if (eObj&&lineobj.Rtti==220){
                    $("#btnAnalysis").removeAttr("disabled");
                    selectedRoadLineGuid=lineobj.Guid;
                    var guid = lineobj.Guid;
                    var dist = lineObjList[guid];
                    if(dist){
                        var distance = dist["CPROADLINE.DISTANCE"];
                        $("#txtDist").val(distance);
                    }

                    earth.Environment.SetHighlightColor(parseInt("0xFFFFFF00"));
                    lineobj.ShowHighLight();
                    break;
                }else {
                    continue;
                    alert("选中的对象不是道路红线，或不属于当前方案，请重新选择.");
                    earth.SelectSet.Clear();
                    $("#txtDist").val("0");
                    $("#btnAnalysis").attr("disabled",true);
                    break;
                }
            }
            if(!(eObj && lineobj.Rtti == 220)){
                alert("选中的对象不是道路红线，或不属于当前方案，请重新选择.");
                earth.SelectSet.Clear();
                $("#txtDist").val("0");
                $("#btnAnalysis").attr("disabled",true);
            }
        }
        earth.ToolManager.SphericalObjectEditTool.Browse();
        earth.Event.OnSelectChanged=function(x){};
    }

    //开始分析
    $("#btnAnalysis").click(function () {
        var dist = $("#txtDist").val();
        earth.Environment.SetHighlightColor(parseInt("0xFFFF0000"));
        if (parseFloat(dist) >= 0) {
            $("#dg>tbody").empty();

            var projId = node.projectId;
            var planId = node.id;
            var planType = 4;
            var planLayerId = projManager.getLayerIdsByPlanId(planId);
			
            initGrid();

            if ($("#rdoAllRoad").attr("checked") == "checked") {
                analyzeRoads(1, projId, planId, roadlineLayerId, planLayerId);
            } else if ($("#rdoSelectRoad").attr("checked") == "checked") {
                analyzeRoads(0, projId, planId, roadlineLayerId, planLayerId);
            }
        }
    });
    /**
     * 根据选中的道路创建缓冲区
     * @param projId 项目ID
     * @param dist 缓冲距离
     * @return {Array} 返回缓冲区数组
     */
    var getBuffersFromSelectSet = function (projId, dist,name) {
        var dists = projManager.getRoadLineData(projId);
        var buffers = [];
        var buffer = null;
        if(selectedRoadLineGuid){
                var getEditLayers = top.editLayers;
                var roadLineLayer = getEditLayers[roadlineLayerId];
                var roadline = roadLineLayer.GetObjByGuid(selectedRoadLineGuid);
                dist = dist || dists[selectedRoadLineGuid];
                buffer = getBufferOfLine(roadline, dist);
                if(buffer){
                    CreateLineBufferInEarth(buffer);
                }
                buffers.push({line: roadline, polygon: buffer,name:name});
        }else{
            for (var i = 0; i < earth.SelectSet.GetCount(); i++) {
                var roadline = earth.SelectSet.GetObject(i);
                if (roadline) {
                    dist = dist || dists[roadline.Guid];
                    buffer = getBufferOfLine(roadline, dist);
                    if(buffer){
                        CreateLineBufferInEarth(buffer);
                    }
                    buffers.push({line: roadline, polygon: buffer,name:name});
                }
            }
        }
        return buffers;
    };
    // 缓冲区
    var CreateLineBufferInEarth = function (polygon,guid) {
        var plg = earth.Factory.CreateElementPolygon(guid, "");
        plg.BeginUpdate();
        plg.SetPolygon(polygon);
        plg.AltitudeType = 1;
        plg.FillStyle.FillColor = 0x320000ff;// 半透红色
        plg.LineStyle.LineColor = 0xcc0000ff;// 红色
        plg.EndUpdate();
        earth.AttachObject(plg);
        lineBufferInEarth.push(plg);
    }
    // 获取线对象
    var getRoadLineObj = function (roadlineLayerId) {
        var tempList = [];
        var getEditLayers = top.editLayers;
        var roadLineLayers = getEditLayers[roadlineLayerId];
        if (roadLineLayers) {
            var objCount = roadLineLayers.GetObjCount();
            if (objCount) {
                for (var i = 0; i < objCount; i++) {
                    var line = roadLineLayers.GetObjAt(i)
                    tempList.push(line);
                }
            }
        }
        return tempList;
    }
    // 计算距离，并返回结果
    var calculateLinePolygonDistance = function (polygonList, line) {
        var result = 0;
        var buildingVects = earth.Factory.CreateVector3s();
        for (var j = 0; j < polygonList.length; j++) {
            var polygon = polygonList[j];
            for (var k = 0; k < polygon.GetRingCount(); k++) {
                var pt = polygon.GetRingAt(k);
                for (var n = 0; n < pt.Count; n++) {
                    buildingVects.AddVector(pt.Items(n));
                }
            }
        }

        var lineVect3s = line.GetPointArray();
        var vect3s = earth.GeometryAlgorithm.CalculateLinePolygonDistance(lineVect3s, buildingVects);
        if (vect3s != null) {
            result = vect3s.Length;
        }
        return result;
    }

    /**
     * 获取红线的距离
     * @param  {[type]} projId [description]
     * @return {[type]}        [description]
     */
    function lineDistanceObj(projId){
        var lineObj={};
        var roadLineData = projManager.getRoadLineData(projId);
        $.each(roadLineData, function (i, line) {
            var lineId=line["CPROADLINE.ID"];
            lineObj[lineId]=line;
        });
        return lineObj;
    }
    // 分析缓冲区
    function analyzeRoads(type, projId, planId, roadlineLayerId, planLayers) {
        var dataArr = [];
        var buffers = [];
        var dist = $("#txtDist").val();
        stopHightLight();
        clearBoxes();
        var lineObjList=lineDistanceObj(projId);
        if (type === 1) {
            var roadLineObj = getRoadLineObj(roadlineLayerId);
            if (!roadLineObj) return;
            for (var l = 0; l < roadLineObj.length; l++) {
                var lineObj = roadLineObj[l];
                var name;
                if(lineObjList[lineObj.Guid]){
                    dist= Number(lineObjList[lineObj.Guid]["CPROADLINE.DISTANCE"]);
                    name=lineObjList[lineObj.Guid]["CPROADLINE.CODE"];
                }
                var polygon = getBufferOfLine(lineObj, dist);
                if (!polygon) {
                    continue;
                }
                CreateLineBufferInEarth(polygon,lineObj.Guid);
                buffers.push({line: lineObj, polygon: polygon,name:name});
            }
        } else {
            if(selectedRoadLineGuid!=null){
                var name;
                if(lineObjList[selectedRoadLineGuid]){
                    if(dist<=0){
                        dist=lineObjList[selectedRoadLineGuid]["CPROADLINE.DISTANCE"];
                    }
                    name=lineObjList[selectedRoadLineGuid]["CPROADLINE.CODE"];
                }
                buffers = getBuffersFromSelectSet(projId, dist,name);
            }
        }

        var modelEditLayerArr = [];
        var polygonEditLayerArr = [];
        var simpleBuildingLayerArr = [];
        for (var j = 0; j < planLayers.length; j++) {
            var getEditLayers = top.editLayers;
            var editLayer = getEditLayers[planLayers[j]];
            if(editLayer && editLayer.DataLayerType == 1 && (editLayer.Name.toLowerCase().indexOf("buildingsmodel") != -1)) {
                modelEditLayerArr.push(editLayer);//3DMax模型
            }if(editLayer && editLayer.DataLayerType == 5 && (editLayer.Name.toLowerCase().indexOf("buildingspolygon") != -1)) {
                polygonEditLayerArr.push(editLayer);//建筑基地矢量面-参数模型
            }else if(editLayer && editLayer.DataLayerType == 8 && (editLayer.Name.toLowerCase().indexOf("simplebuilding") != -1)){
                simpleBuildingLayerArr.push(editLayer);//简单建筑
            }else if(editLayer && editLayer.DataLayerType == 14 && (editLayer.Name.toLowerCase().indexOf("shpbuilding") != -1)){
                simpleBuildingLayerArr.push(editLayer);//矢量楼块
            }
        }

        for (var i = 0; i < buffers.length; i++) { // 道路
            for(var j = 0; j < polygonEditLayerArr.length; j++){
                var objCount = polygonEditLayerArr[j].GetObjCount();//获取编辑图层的对象数量
                var shpBuilName = null;
                for(var k = 0;k < objCount; k++){
                    var item = polygonEditLayerArr[j].GetObjAt(k);
                    var polygonPoints = item.GetPolygon(1);
                    var shpBuilName = item.Name;
                    var relation = earth.PolygonAlgorithm.PolysRelationship(polygonPoints, buffers[i].polygon);
                    if (relation <= 3) {
                        var modelObj = projManager.getModelByPolygon(planLayers, top.editLayers, item, polygonEditLayerArr[j]);
                        if(!modelObj){
                            continue;
                        }
                        var distance = calculateLinePolygonDistance([polygonPoints], buffers[i].line);
                        item.HightLightIsFlash(false);
                        item.ShowHighLight();
                        highLightObjArr.push(item);
                        dataArr.push({"jzmc": shpBuilName, "hxmc": buffers[i].name, "hxjl": distance.toFixed(2), obj: item});
                    }
                }
            }

            //简单建筑和矢量楼块
            for(var j = 0; j < simpleBuildingLayerArr.length; j++){
                var objCount = simpleBuildingLayerArr[j].GetObjCount();//获取编辑图层的对象数量
                var shpBuilName = null;
                
                for(var k = 0;k < objCount; k++){
                    var item = simpleBuildingLayerArr[j].GetObjAt(k);
                    var polygonPoints = item.GetPolygon(1);
                    var shpBuilName = item.Name;
                    
                    var relation = earth.PolygonAlgorithm.PolysRelationship(polygonPoints, buffers[i].polygon);
                    if (relation <= 3) {
                        var distance = calculateLinePolygonDistance([polygonPoints], buffers[i].line);
                        item.HightLightIsFlash(false);
                        item.ShowHighLight();
                        highLightObjArr.push(item);
                        dataArr.push({"jzmc": shpBuilName, "hxmc": buffers[i].name, "hxjl": distance.toFixed(2), obj: item});
                    }
                }
            }
        }
        $("#dg").datagrid("loadData", dataArr);
    }

    //datagrid双击事件
    var dbclick = function (rowIndex, rowData) {
        var rows = $("#dg").datagrid("getRows");
        var obj = rows[rowIndex].obj;
        if (obj) {
            projManager.centerObject(obj);
        }
    }

    //初始化grid展示列表表头
    var initGrid = function(){
        var column = [];
        column.push({
            field: 'jzmc',
            title: '建筑名称',
            width: 70
        });
        column.push({
            field: 'hxmc',
            title: '红线名称',
            width: 70
        });
        column.push({
            field: 'hxjl',
            title: '红线距离',
            width: 70
        });

        //datagrid 设置
        $("#dg").datagrid({
            columns: [column],
            onDblClickRow: dbclick
        });
    }

    //页面关闭
    $(window).unload(function () {
        if(earth == null){
            return;
        }

        clearBoxes();//清空控规盒
        stopHightLight();//清空高亮
        if(earth.SelectSet){
            earth.SelectSet.Clear();//清空选泽
        }

        if(projManager && node && !isParamModel){
            projManager.showParamModel(node.id, false);
        }

        var sr = getRoadState();
        if(sr!= isShowRoad){
            setRoadState(isShowRoad);
        }
    });
    

    function clearAll(){
        clearBoxes();//清空控规盒
        stopHightLight();//清空高亮
        if(earth.SelectSet){
            earth.SelectSet.Clear();//清空选泽
        }

        $("#dg").datagrid("loadData", []);
    }
});

// 获取红线的状态
function getRoadState(){
    var zTree = top.getOperatorObject().$.fn.zTree.getZTreeObj("projTree");
    var rn = zTree.getNodeByParam("type", "ROADLINE");
    return rn.checked;
}
// 设置红线的状态
function setRoadState(isShow){
    var zTree = top.getOperatorObject().$.fn.zTree.getZTreeObj("projTree");
    var rn = zTree.getNodeByParam("type", "ROADLINE");
    zTree.checkNode(rn,isShow,true,true);
}