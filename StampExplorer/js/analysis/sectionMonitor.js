/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：断面监测
 * 注意事项：该文件方法仅为断面监测使用
 * 遗留bug ：无
 * 修改日期：2017年11月07日
 ****************************************************************/
var earth = null;
var demArr = [];
var legalDemArr = [];
var thisProject = null;
var documentObj = null;//index页面

$(function(){
    $("#project").change(function(){
        $("#demList").empty();
        initDemList();
    });
    $("#btnStart").click(function(){
        var space = $("#space").val();
        if(isNaN(space) || !space){
            alert("请输入合理的采样间距");
            return;
        }
        var resultObj = [];
        var maxHeight = null;
        var minHeight = null;
        var checkLen = $("#demList input:checkbox[checked=checked]").length;
        if(checkLen < 1){
            alert("请至少选择1个dem图层");
            return;
        }

        clear();
        earth.Event.OnAnalysisFinished = function (res) {
            var resultXml = res.BriefDescription;
            if(!resultXml){
                alert("服务返回值为空");
                return;
            }
            var resultJson = $.xml2json(resultXml);
            if(!resultJson){
                return;
            }
            var layer = resultJson.layer
            if(!layer){
                return;
            }
            if(!layer.length){
                layer = [layer];
            }
            var seriesList = [];
            var xPoints = [];
            var noDataLayer = "";
            var noData = true;
            for(var i=0; i<layer.length; i++){
                var layerGuid = layer[i].guid;
                for(var z=0; z<thisProject.dem.length; z++){
                    var thisDem = thisProject.dem[z];
                    if(layerGuid == thisDem.id){
                        var layerName = thisDem.name;
                        break;
                    }
                }
                var layerMaxHeight = layer[i].max_height;
                var layerMinHeight = layer[i].min_height;
                var layerPointNum = layer[i].point_number;
                var pointArr = layer[i].point_array;
                if(!pointArr){
                    var thisLayer = earth.LayerManager.GetLayerByGUID(layerGuid);
                    if(thisLayer){
                        var thisName = thisLayer.Name;
                        noDataLayer += thisName + ",";
                    }
                    continue;
                }else{
                    noData = false;
                }
                pointArr = pointArr.split(",")
                var layerPointArr = [];
                var layerHeightArr = [];

                for(var j=0; j<layerPointNum; j++){
                    if(i == 0){
                        xPoints.push(j+1);//样点从1开始标号
                    }

                    var thisPoint = [pointArr[j*4],pointArr[j*4+1],pointArr[j*4+2]];
                    var thisPointHeight = pointArr[j*4+2] ? parseFloat(pointArr[j*4+2]) : 0;//画图一定要用数字！！！
                    layerPointArr.push(thisPoint);
                    layerHeightArr.push(thisPointHeight);
                }
                if(!maxHeight){
                    maxHeight = layerMaxHeight;
                }else{
                    layerMaxHeight>maxHeight?maxHeight=layerMaxHeight:maxHeight;
                }
                if(!minHeight){
                    minHeight = layerMinHeight;
                }else{
                    layerMinHeight < minHeight?minHeight = layerMinHeight:minHeight;
                }
                var thisObj = {
                    guid:layerGuid,
                    name:layerName,
                    max:layerMaxHeight,
                    min:layerMinHeight,
                    pointArr:layerPointArr,
                    heightArr:layerHeightArr
                }
                resultObj.push(thisObj);
                var thisData = {
                    name:layerName,
                    data:layerHeightArr
                }
                seriesList.push(thisData);

            }
            if(noData){
                alert("无数据返回,可能数据有误");
                return;
            }else{
                documentObj.showSectionMonitor(xPoints,seriesList,minHeight,maxHeight,resultObj);
                if(noDataLayer){
                    alert("图层"+noDataLayer+"在此处无数据");
                }
            }
        };
        earth.Event.OnCreateGeometry = function(p,cType){
            if(p.Count < 2){
                alert("请至少画两个点");
                return;
            }
            var guidStr = "";
            $("#demList input:checkbox[checked=checked]").each(function (i, v) {
                var len = $("#demList input:checkbox[checked=checked]").length;
                if(i==len-1){
                    guidStr += $(v).val();
                }else{
                    guidStr += $(v).val()+",";
                }
            });
            var geoPoints = earth.Factory.CreateGeoPoints();
            for(var i=0; i<p.Count; i++){
                var thisVec = p.Items(i);
                geoPoints.Add(thisVec.X,thisVec.Y,thisVec.Z)
            }
            var space = $("#space").val();
            earth.Analysis.ProfilePoints(1,space, geoPoints,guidStr)

        }
        earth.ShapeCreator.CreatePolyline(0, 0xcc111111)
    });
    window.onunload = function(){
        clear();
        documentObj.resizeEarthTool();
    }
    $("#clear").click(function(){
        clear();
        if(earth.htmlBallon){
            earth.htmlBallon.DestroyObject();
            earth.htmlBallon = null;
        }
    });
    $("#scrollParamDiv").mCustomScrollbar({});
});

function getEarth(earthObj){
    earth = earthObj;
    documentObj = earth.ifEarth;
    demArr = earth.demArr;
    var projectId = earth.projectId;
    initProject(demArr);
    initDemList();
}
function clear(){
    earth.ShapeCreator.Clear();
    documentObj.hideProfile();
}