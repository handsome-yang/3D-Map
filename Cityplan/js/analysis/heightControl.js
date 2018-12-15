/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：控高分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
jQuery.support.cors = true; //开启jQuery跨域支持
var earth = top.LayerManagement.earth;
var boxes = []; // 控高盒
var fillColor;//控高盒颜色
var projManager = top.projManager;
var node = top.selNode;
$(function() {
    var highLightObjArr = [];
    var jzxg = 60;
    var isParamModel = false;
    isParamModel = projManager.getParamModelVisibility();

    //布局
    setGidOuterDivHeight();

    if(!node) {
        alert("请先选择一个方案才能进行控高分析");
        return;
    }
    var projData = projManager.getProjectData({id: node.projectId});
    if (projData && projData[0] && projData[0]["CPPROJECT.JZXG"]) {
        jzxg = projData[0]["CPPROJECT.JZXG"];
        $("#txtHeight").val(jzxg);
    }

    //初始化
    var init = function() {
        if (node && node.type == "PLAN") {
            $("#btnAnalysis").attr("disabled", false);
            showPlanLayer();
        }
    }
    
    init();

    //显示方案图层
    function showPlanLayer(){
        projManager.showParamModel(node.id, true);
        //暂时注释掉，因为当前项目的当前选中方案必须勾选了才能进入此功能，所以这一步属于多余。
        // projManager.showAll(node.projectId, node.id, true, true, false, false, false);
    }

    var clearBoxes = function() {
        $.each(boxes, function(i, box) {
            earth.DetachObject(box);
        });
        boxes = [];
    };
    // 停止高亮闪烁
    var stopHightLight = function() {
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
    // 创建控高盒
    var createBoxByParcelLayerId = function(parcelLayerId, height) {
        clearBoxes();
        //修复bug:无现状数据时不生成控高盒
        if (parcelLayerId) {
            var ploygonLayersVcts3 = top.ploygonLayersVcts3;
            var vect3 = ploygonLayersVcts3[parcelLayerId]; //用规划用地的范围生成控高盒
            if (vect3) {
                if(!$.isArray(vect3)){
                    vect3 = [vect3];
                }

                for(var k = 0; k < vect3.length; k++){
                    var volume = earth.Factory.CreateElementVolume(earth.Factory.CreateGuid(), "");
                    volume.BeginUpdate();
                    //创建多边形对象
                    var newPolygon = earth.Factory.CreatePolygon();
                    newPolygon.AddRing(vect3[k]);
                    //获取多边形中心点
                    var cp = newPolygon.GetCenterPoint();
                    var ch = earth.Measure.MeasureTerrainAltitude(cp.X, cp.Y);
                    var v3s = newPolygon.GetRingAt(0);
                    for (var j = 0; j < v3s.Count; j++) {
                        v3s.SetAt(j, v3s.Items(j).X, v3s.Items(j).Y, ch);
                    }
                    volume.SetPolygon(1, newPolygon); 
                    volume.height = parseFloat(height);
                    //设置控高盒的颜色
                    //50为颜色透明度
                    fillColor = parseInt(80).toString(16) + $("#boxColor").val().substring(1);
                    if(fillColor){
                        volume.FillColor = parseInt("0x"+fillColor);
                    }else{
                        volume.FillColor = 0x80FFFFFF;
                    }
                    volume.Editable = false;
                    volume.selectable = false;
                    volume.EndUpdate();
                    if (projManager.IsValid(vect3[k])) {
                        volume.SphericalTransform.SetLocationEx(vect3[k].X, vect3[k].Y, vect3[k].Z);
                    }
                    earth.AttachObject(volume);
                    boxes.push(volume);
                }
            }
        }
    };
    // 初始化表格
    var initGrid = function(){
        var column = [];
        column.push({
            field: 'jzmc',
            title: '建筑名称',
            width: 70
        });
        column.push({
            field: 'gd',
            title: '高度(m)',
            width: 70
        });
        column.push({
            field: 'cg',
            title: '超高(m)',
            width: 70
        });

        //datagrid 设置
        $("#dg").datagrid({
            columns: [column],
            onDblClickRow: dbclick
        });
    }

    //开始分析按钮事件
    $("#btnAnalysis").click(function() {
        var projHeight = $("#txtHeight").val();
        if (isNaN(projHeight)) {
            alert("请输入大于等于0的数字!");
            return;
        }
        initGrid();
        var dataArr = [];
        $("#dg>tbody").empty();
        $("#dg").datagrid("loadData", []);
		
        var projId = node.projectId;
        var planId = node.id;
        var parcelLayerId = node.parcelId;
        if(earth.SelectSet){
            earth.SelectSet.Clear(); //清空选泽    
        }
        createBoxByParcelLayerId(parcelLayerId, projHeight);//创建box包围盒
        var fieldName, fieldFloor, fieldFloorHeight; // 数据库中的字段名称
        // showPlanLayer();//显示方案图层
        var buildingData = projManager.getBuildingDataByPlanId(planId);
        var simpleBuildingData = projManager.getSimpleBuildingDataByPlanId(planId);
        var planLayers = projManager.getLayerIdsByPlanId(planId);
        stopHightLight(); //清空高亮

        //3DMax模型数据
        $.each(buildingData, function(i, buildData) {
            var height = parseFloat(buildData["CPBUILDING.JZGD"]);
            var buildId = buildData["CPBUILDING.ID"];
            var cg = height - projHeight;
            //遍历方案图层
            for (var j = 0; j < planLayers.length; j++) {
                var getEditLayers = top.editLayers;
                var editLayer = getEditLayers[planLayers[j]];
                //判断是否是方案的标准3DMax的模型图层
                if (editLayer && editLayer.DataLayerType == 1 && (editLayer.Name.toLowerCase().indexOf("buildingsmodel") != -1)) {
                    
                    var obj = editLayer.GetObjByGuid(buildId);
                    if(!obj){//根据ID查找时，未找到模型对象直接继续下一个图层
                        continue;
                    }

                    //根据3dMax的模型找到参数模型对象
                    var polygonObj = projManager.getPolygonObjByModel(planLayers, getEditLayers, obj, editLayer);
                    if (!polygonObj) {//未找到参数模型对象时，直接继续下一个图层查找
                        continue;
                    }

                    //下面是找到了模型对象，则停止遍历图层，直接继续查找下一个模型
                    if(cg > 0){//超高的高亮显示，并放入高亮数组里面；
                        polygonObj.HightLightIsFlash(false);
                        polygonObj.ShowHighLight();
                        highLightObjArr.push(polygonObj);        
                    }
                    if(height == undefined){//高度为空时默认给0
                        height = 0;
                    }
                    dataArr.push({//对象信息存入列表，后面展示和定位高亮时使用
                        "jzmc": buildData["CPBUILDING.NAME"],
                        "gd": height.toFixed(2),
                        "cg": (height - projHeight).toFixed(2),
                        obj: polygonObj
                    }); 
                    break;
                }
            }
        });

        //简单建筑和矢量楼块数据遍历查找
        $.each(simpleBuildingData, function(i, buildData) {
            var buildId = buildData["CPSIMPLEBUILD.ID"];
            for (var j = 0; j < planLayers.length; j++) {
                var getEditLayers = top.editLayers;
                var editLayer = getEditLayers[planLayers[j]];
                if (editLayer && ((editLayer.DataLayerType == 14 && (editLayer.Name.toLowerCase().indexOf("shpbuilding") != -1))
                            || (editLayer.DataLayerType == 8 && (editLayer.Name.toLowerCase().indexOf("simplebuilding") != -1)))) {
                    var obj = editLayer.GetObjByGuid(buildId);
                    if(!obj){
                        continue;
                    }
                    if(editLayer.DataLayerType == 8){//8为简单建筑，包含顶，所以要单独计算高度
                        var height = parseFloat(buildData["CPSIMPLEBUILD.FLOOR"]) * parseFloat(buildData["CPSIMPLEBUILD.FLOORHIGHT"]) + obj.GetRoofHeight();    
                    }else{//其他为矢量楼块建筑，不含顶
                        var height = parseFloat(buildData["CPSIMPLEBUILD.FLOOR"]) * parseFloat(buildData["CPSIMPLEBUILD.FLOORHIGHT"]);
                    }

                    if(height == undefined){//高度为空时默认给0
                        height = 0;
                    }
                    
                    var cg = height - projHeight;
                    if (cg > 0) {//超高的高亮显示，并放入高亮数组里面；
                        obj.HightLightIsFlash(false);
                        obj.ShowHighLight();
                        highLightObjArr.push(obj);    
                    }

                    dataArr.push({//对象信息存入列表，后面展示和定位高亮时使用
                        "jzmc": buildData["CPSIMPLEBUILD.NAME"],
                        "gd": height.toFixed(2),
                        "cg": (height - projHeight).toFixed(2),
                        obj: obj
                    });    
                    break;
                }
            }
        });
        $("#dg").datagrid("loadData", dataArr);
    });

    //datagrid双击事件
    var dbclick = function(rowIndex, rowData) {
        var rows = $("#dg").datagrid("getRows");
        var obj = rows[rowIndex].obj;
        if (obj) {
            projManager.centerObject(obj);
        }
    }
    
    $("#txtHeight").change(function() {
        if (isNaN($("#txtHeight").val()) || $("#txtHeight").val() < 0) {
            alert("请输入大于等于0的数字");
            $("#btnAnalysis").attr("disabled", true);
        } else {
            $("#btnAnalysis").attr("disabled", false);
        }
    });
    $("#txtHeight").trigger("change");

    $(window).unload(function() {
        if (earth == null) {
            return;
        }
        clearBoxes(); //清空控规盒
        stopHightLight(); //清空高亮
        if(earth.SelectSet){
            earth.SelectSet.Clear(); //清空选泽    
        }
        if(projManager && node && !isParamModel){
            projManager.showParamModel(node.id, false);
        }
    });
});

function rStyler(index, row) {
    var projHeight = $("#txtHeight").val();
    if (row.gd > parseFloat(projHeight)) {
        return 'background-color:#ffee00;color:red;';
    }
}
// 控高面颜色
function boxColorDlg() {
    var sColor = null;
    var sInitColor = document.getElementById("boxColor").value;
    if (sInitColor == null) {
        sColor = dlgHelper.ChooseColorDlg();
    } else {
        sColor = dlgHelper.ChooseColorDlg(sInitColor);
    }
    sColor = sColor.toString(16);
    if (sColor.length < 6) {
        var sTempString = "00000000".substring(0, 6 - sColor.length);
        sColor = sTempString.concat(sColor);
    }
    sColor = "#" + sColor;
    $("#boxColor").val(sColor);
    document.getElementById("boxColorSel").style.background = sColor;
    sInitColor = sColor;
}