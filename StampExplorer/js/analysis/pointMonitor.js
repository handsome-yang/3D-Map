/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：单点监测的主要js文件
 * 遗留bug ：无
 * 修改日期：2017年11月07日
 **************************************************/
var earth = null;
var demArr = [];
var legalDemArr = [];
var thisProject = null;
var pointsLength = 0;
var markElements = [];
var elementLines = [];
var geoPoints = null;
var lineV3s = null;
var resultObj = {};
var heightsArr = [];
var documentObject = null;
var resultGuid = [];
var pointArr = null;

$(function(){
    $("#project").change(function(){
        $("#demList").empty();
        initDemList();
    });
    $("#btnStart").click(function(){
        var checkLen = $("#demList input:checkbox[checked=checked]").length;
        if(checkLen < 2){
            alert("请至少选择两个dem图层");
            return;
        }
        
        clear();
        // 分析完成事件
        earth.Event.OnAnalysisFinished = function (res) {
            getResultArr(res);
            
            var xCategories = [];
            var selectDem = [];
            $("#demList input:checkbox[checked=checked]").each(function (i, v) {
                xCategories.push($(v).attr("demName"));
                selectDem.push($(v).val());
            });
            var serieList = [];
            
            var serieList = [];
            var noData = [];
            for(var z=0; z<pointsLength; z++){
                noData.push(20);
            }
            for(var j=0; j<selectDem.length; j++){
                var heightPushed = false;
                if($.inArray(selectDem[j],resultGuid) < 0){
                    if(!heightPushed){
                        heightsArr.push(20)
                        heightPushed = true;
                    }
                    resultObj[selectDem[j]] = noData;
                }
            }
            for(var m=0; m<pointsLength; m++){
                var thispPintHeights = [];
                for(var n=0; n<selectDem.length; n++){
                    var thisHeightArr = resultObj[selectDem[n]];
                    thispPintHeights.push(Number(thisHeightArr[m]));
                }
                var thisPointObj = {
                    name:"监测点"+(m+1),
                    data:thispPintHeights
                }
                serieList.push(thisPointObj);
            }
            var minValue = Math.min.apply(null,heightsArr);
            var maxValue = Math.max.apply(null,heightsArr);
            documentObj.showPointMonitor(xCategories,minValue,serieList,maxValue,pointArr);
        };
        // 创建几何对象完成事件
        earth.Event.OnCreateGeometry = function(p,cType){
            if(p){
                pointsLength++;
                geoPoints.AddPoint(p);
                createMarkElement(p);
                if(lineV3s.Count < 2){
                    lineV3s.Add(p.Longitude,p.Latitude,p.Altitude);
                }else{
                    lineV3s.Remove(0);
                    lineV3s.Add(p.Longitude,p.Latitude,p.Altitude);
                }
                createLine();
                earth.ShapeCreator.CreatePoint(); 
            }else{
                var guidStr = "";
                $("#demList input:checkbox[checked=checked]").each(function (i, v) {
                    var len = $("#demList input:checkbox[checked=checked]").length;
                    if(i==len-1){
                        guidStr += $(v).val();
                    }else{
                        guidStr += $(v).val()+",";
                    }
                });
                earth.Analysis.LayersPointsCarve(guidStr,geoPoints);
            }
            
        }
        earth.ShapeCreator.CreatePoint();
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
})
function getResultArr(res){
    var resultXml = res.BriefDescription;
    if(resultXml){
        var result = $.xml2json(res.BriefDescription);
        if(!result){
            return;
        }
        pointArr = result.position;
        var altitudes = result.altitudes;
        if(!altitudes){
            return;
        }
        if(!altitudes.length){
            altitudes = [altitudes];
        }
        for(var i=0; i<altitudes.length; i++){
            var thisAltitude = altitudes[i].altitude;
            if(!thisAltitude){
                return;
            }
            if(!thisAltitude.length){
                thisAltitude = [thisAltitude];
            }
            for(var j=0; j<thisAltitude.length; j++){
                var thisGuid = thisAltitude[j].guid;
                var thisHeight = thisAltitude[j].height;
                thisHeight<0?thisHeight=0:thisHeight;
                if($.inArray(thisGuid,resultGuid<0)){
                    resultGuid.push(thisGuid);
                }
                if(!resultObj[thisGuid]){
                    resultObj[thisGuid] = [thisHeight];
                }else{
                    resultObj[thisGuid].push(thisHeight);
                }
                heightsArr.push(thisHeight);
            }
        }
    }
}
function createLine(){
    if(lineV3s.Count != 2){
        return;
    }
    var lineGuid = earth.Factory.CreateGUID();
    var elementLine = earth.Factory.CreateElementLine(lineGuid,"line");
    elementLine.BeginUpdate();
    elementLine.SetPointArray(lineV3s);
    elementLine.LineStyle.LineColor = parseInt("0xffffff");
    elementLine.LineStyle.LineWidth = 1;
    elementLine.AltitudeType = 1;
    elementLine.Visibility = true;
    elementLine.Selectable = false;
    elementLine.Editable = false;
    elementLine.DrawOrder = 0;
    elementLine.EndUpdate();
    earth.AttachObject(elementLine);
    elementLines.push(elementLine);
}
// 创建监测点
function createMarkElement(p){
    var text = "监测点" + pointsLength;
    var id = earth.Factory.CreateGuid();
    var markedIcon = earth.Factory.CreateElementIcon(id, "point");
    markedIcon.Create(p.Longitude, p.Latitude, p.Altitude, "", "", text);
    markedIcon.Visibility = true;
    markedIcon.ShowHandle = true;
    markedIcon.HandleHeight = 6;
    markedIcon.TextFormat = 256;
    markedIcon.minVisibleRange = 0;
    markedIcon.maxVisibleRange = 100;
    earth.AttachObject(markedIcon);
    markElements.push(markedIcon);
}

function getEarth(earthObj){
    earth = earthObj;
    documentObj = earth.ifEarth;
    geoPoints = earth.Factory.CreateGeoPoints();
    lineV3s = earth.Factory.CreateVector3s();
    demArr = earth.demArr;
    var projectId = earth.projectId;
    initProject(demArr);
    var str=initDemList();
    $(str).appendTo("#demList");
}
function clearLines(){
    for(var i=0; i<elementLines.length; i++){
        earth.DetachObject(elementLines[i]);
    }
    elementLines = [];
}
function clearMarks(){
    for(var i=0; i<markElements.length; i++){
        earth.DetachObject(markElements[i]);
    }
    markElements = [];
}
function clear(){
    clearLines();
    clearMarks();
    lineV3s = earth.Factory.CreateVector3s();
    geoPoints = earth.Factory.CreateGeoPoints();
    heightsArr = [];
    pointsLength = 0;
    resultObj = {};
    documentObj.hideProfile()
}