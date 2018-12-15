/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：设置等高线
 * 注意事项：该文件方法仅为等高线使用
 * 遗留bug ：无
 * 修改日期：2017年11月07日
 *****************************************************************/
var earth,analysis,htmlBalloon;
function getEarth(earthObj){
    earth = earthObj;
    analysis = STAMP.Analysis(earth);
    htmlBalloon = earth.htmlBallon;
}

//容错判断
function check(path, reference){

    var pathStr = path.split(".");
    var type = pathStr[pathStr.length - 1];
    if (type != "dwg" && type != "dxf" && type != "shp"){
        alert("矢量文件格式不正确,请重新选择文件!");
        return false;
    }

    var referenceStr = reference.split(".");
    var referencetype = referenceStr[referenceStr.length - 1];
    if (referencetype != "spatial"){
        alert("空间参考文件格式不正确,请重新选择文件!");
        return false;
    }

    if (path === "" || path === undefined || reference === "" || reference === undefined) {
        alert("请选择文件与投影文件!");
        return false;
    }

    return true;
}

$(function(){
    // 退出按钮
    $("#clear").click(function(){
        analysis.clear();
        htmlBalloon.DestroyObject();
    })
    // 分析按钮
    $("#btnSet").click(function(){

        var stride = $("#stride").val();
        if(isNaN(parseFloat(stride))){
            alert("请输入正确的间距值");
            return;
        }
        var color = $("#color").val();
        color = color.substr(1,6);
        color = "0xff" + color;
        analysis.contour(parseFloat($("#stride").val()),parseInt(color),$("#exportShp"));
    });
    //选择导入文件
    $("#selectImg").click(function (){
        var filePath = earth.UserDocument.SaveFileDialog(earth.RootPath, "*.shp", "shp");
        if (filePath == "") {
            return;
        }
        $("#selectPath").attr("value", filePath);
    });
    //选择投影文件
    $("#selectSpat").click(function(){
        var filePath =  earth.UserDocument.OpenFileDialog(earth.RootPath, "spatial文件(*.spatial)|*.spatial");
        if (filePath == ""){
            return;
        }
        $("#referenceInput").attr("value", filePath);
    });
    // 导出SHP文件
    $("#exportShp").click(function(){
        if(contourPolygonObj){
            var path = $("#selectPath").val();
            var reference = $("#referenceInput").val();
            if(!check(path,reference)){
                return;
            }
            var coords = [];
            var contourPolygonLen = contourPolygonObj.GetContourCount();
            for(var i=0; i<contourPolygonLen; i++){
                var thisCoords = ""
                var thisVec3s = contourPolygonObj.GetContourBynNum(i);
                for(var j=0; j<thisVec3s.Count; j++){
                    var thisVec3 = thisVec3s.Items(j);
                    if(j == thisVec3s.Count - 1){
                        thisCoords += thisVec3.X + "," + thisVec3.Y + "," + thisVec3.Z;
                    }else{
                        thisCoords += thisVec3.X + "," + thisVec3.Y + "," + thisVec3.Z + " ";
                    }
                }

                coords.push(thisCoords);
            }
            if(!coords.length){
                alert("未生成等高线，请重新绘制区域");
                return;
            }
            path = path.substring(0, path.lastIndexOf("."))
            var exp = STAMP.ExportSHP(earth, path, reference, coords, 220, true);
            exp.exportFileToShape();

        }else{
            alert("未生成等高线，请绘制区域");
        }
    });
    window.onunload = function(){
        analysis.clear();
    }
})