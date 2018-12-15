/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：导入SHP
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var earth = "";
function getEarth(earthObj) {
    earth = earthObj;
    var temp = earth.userdataTemp;
    var KeyVal = {};
    var locat;
    var analysis = STAMP.Analysis(earth);
    //选择导入文件
    $("#selectImg").click(function() {
        var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "shape文件(*.shp)|*.shp|dxf文件(*.dxf)|*.dxf|dwg文件(*.dwg)|*.dwg");
        if (filePath == "") {
            return;
        }
        $("#selectPath").attr("value", filePath);
        if ("" != $("#referenceInput").val()) {
            $("#importBtn").attr("disabled", false);
        }
    });

    //选择投影文件
    $("#selectSpat").click(function() {
        var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "spatial文件(*.spatial)|*.spatial");
        if (filePath == "") {
            return;
        }
        $("#referenceInput").attr("value", filePath);
        if ("" != $("#selectPath").val()) {
            $("#importBtn").attr("disabled", false);
        }
    });

    //导入按钮触发函数
    $("#importBtn").click(function() {
        var path = $("#selectPath").val();
        var reference = $("#referenceInput").val();
        if (check(path, reference)) {
            if (path && reference) {
                $("#selectPath").attr("disabled", true);
                $("#selectImg").attr("disabled", true);
                $("#referenceInput").attr("disabled", true);
                $("#selectSpat").attr("disabled", true);
                $("#importBtn").attr("disabled", true);
                $("#clear").attr("disabled", true);
                window.setTimeout(function() {
                    var pathStr = path.split(".");
                    var type = pathStr[pathStr.length - 1];
                    var exp = STAMP.ExportSHP(earth);
                    exp.importFile(path, reference, type, temp);
                    KeyVal[path] = path;
                    locat = exp.getLocationObj();
                }, 0);
            }
        }
    });

    $("#clear").click(function() {
        analysis.clearHtmlBallon(earth.htmlBallon);
    });
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
}