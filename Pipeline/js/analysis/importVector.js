/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：导入矢量js文件
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 **************************************************/
var obj = window.dialogArguments;
var earth = obj.earth;
var KeyVal = {};
var locat;

//选择导入文件
function selectVect() {
    var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "shape文件(*.shp)|*.shp|dxf文件(*.dxf)|*.dxf|dwg文件(*.dwg)|*.dwg");
    if (filePath == "") {
        return;
    }
    $("#selectPath").attr("value", filePath);
}

//选择投影文件
function addSpatialReference() {
    var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "spatial文件(*.spatial)|*.spatial");
    if (filePath == "") {
        return;
    }
    $("#referenceInput").attr("value", filePath);
}

//导入按钮触发函数
function importVect() {
    //var userdata = STAMP.Userdata();
    var path = $("#selectPath").val();
    var reference = $("#referenceInput").val();
    if (check(path, reference)) {
        if (path && reference) {
            //获取图层类型 如shape, dxf, dwg
            var pathStr = path.split(".");
            var type = pathStr[pathStr.length - 1];
            var exp = STAMP.ExportSHP(earth);
            var polygon = exp.importFile(path, reference, type);
            KeyVal[path] = path;
            obj.polygon = polygon;
        }
    } else {
        return;
    }
    window.close();
}

//容错判断
function check(path, reference) {

    var pathStr = path.split(".");
    var type = pathStr[pathStr.length - 1];
    if (type != "dwg" && type != "dxf" && type != "shp") {
        alert("矢量文件格式不正确,请重新选择文件!");
        return false;
    }

    var referenceStr = reference.split(".");
    var referencetype = referenceStr[referenceStr.length - 1];
    if (referencetype != "spatial") {
        alert("空间参考文件格式不正确,请重新选择文件!");
        return false;
    }

    if (path === "" || path === undefined || reference === "" || reference === undefined) {
        alert("请选择文件与投影文件!");
        return false;
    }

    if (KeyVal[path]) {
        alert("您已经导入过了!");
        if (locat && locat.lon && locat.lat) {
            earth.GlobeObserver.FlytoLookat(locat.lon, locat.lat, 50, 0, 60, 0, 200, 5);
        }
        return false;
    }

    return true;
}