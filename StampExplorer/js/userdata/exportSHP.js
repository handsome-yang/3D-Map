/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：导出SHP
 * 注意事项：该文件方法仅为导出SHP使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/
var earth = null;//三维球对象
// 点数据
function checkpoint() {
    if ($("#point").attr("checked") == "checked") {
        $("#selectPointPath").attr("disabled", false);
        $("#selectPointPath").attr("src", "../../images/dialog/file.png");
        $("#addSpatialReference").attr("disabled", false);
        $("#addSpatialReference").attr("src", "../../images/dialog/file.png");

        $("#lblXp").css({
            color: "#000000"
        });
        $("#lblX").css({
            color: "#000000"
        });
    } else {
        if (($("#polygoy").attr("checked") == "checked") || ($("#line").attr("checked") == "checked")) {
            $("#addSpatialReference").attr("disabled", false);//取消禁用
            $("#addSpatialReference").attr("src", "../../images/dialog/file.png");
            $("#lblX").css({
                color: "#000000"
            });
        } else {
            $("#addSpatialReference").attr("disabled", true);//禁用
            $("#addSpatialReference").attr("src", "../../images/dialog/file3.png");
            $("#lblX").css({
                color: "#C0C0C0"
            });
        }
        $("#selectPointPath").attr("disabled", true);
        $("#selectPointPath").attr("src", "../../images/dialog/file3.png");
        $("#lblXp").css({
            color: "#C0C0C0"
        });
    }
    updateUi();
}
// 线数据
function checkline() {
    if ($("#line").attr("checked") == "checked") {
        $("#selectLinePath").attr("disabled", false);
        $("#selectLinePath").attr("src", "../../images/dialog/file.png");
        $("#addSpatialReference").attr("disabled", false);
        $("#addSpatialReference").attr("src", "../../images/dialog/file.png");
        $("#lblXx").css({
            color: "#000000"
        });
        $("#lblX").css({
            color: "#000000"
        });
    } else {
        if ($("#polygoy").attr("checked") == "checked") {
            $("#addSpatialReference").attr("disabled", false);
            $("#addSpatialReference").attr("src", "../../images/dialog/file.png");
            $("#lblX").css({
                color: "#000000"
            });
        } else {
            $("#addSpatialReference").attr("disabled", true);
            $("#addSpatialReference").attr("src", "../../images/dialog/file3.png");
            $("#lblX").css({
                color: "#C0C0C0"
            });
        }
        $("#selectLinePath").attr("disabled", true);
        $("#selectLinePath").attr("src", "../../images/dialog/file3.png");
        $("#lblXx").css({
            color: "#C0C0C0"
        });
    }

    updateUi();
}
// 面数据
function checkPolygoy() {
    if ($("#polygoy").attr("checked") == "checked") {
        $("#selectPolygonPath").attr("disabled", false);
        $("#selectPolygonPath").attr("src", "../../images/dialog/file.png");
        $("#addSpatialReference").attr("disabled", false);
        $("#addSpatialReference").attr("src", "../../images/dialog/file.png");
        $("#lblXm").css({
            color: "#000000"
        });
        $("#lblX").css({
            color: "#000000"
        });
    } else {
        if ($("#line").attr("checked") == "checked") {
            $("#addSpatialReference").attr("disabled", false);
            $("#addSpatialReference").attr("src", "../../images/dialog/file.png");
            $("#lblX").css({
                color: "#000000"
            });
        } else {
            $("#addSpatialReference").attr("disabled", true);
            $("#addSpatialReference").attr("src", "../../images/dialog/file3.png");
            $("#lblX").css({
                color: "#C0C0C0"
            });
        }
        $("#selectPolygonPath").attr("disabled", true);
        $("#selectPolygonPath").attr("src", "../../images/dialog/file3.png");
        $("#lblXm").css({
            color: "#C0C0C0"
        });
    }
    updateUi();
}
/**
 * [getEarth 操作三维球对象]
 * @param  {[obj]} earthObj [三维球]
 * @return {[type]}          [description]
 */
function getEarth(earthObj) {
    earth = earthObj;
    var path;
    var reference;
    var analysis = earth.analysisObj;

    window.onunload = function () {
        earth.ToolManager.SphericalObjectEditTool.Browse();
    }
    // 选择面文件路径
    $("#selectPolygonPath").click(function () {
        selectPath("PolygonPathSelected");
        if ("" != $("#referenceInput").val()) {
            $("#exportShape").attr("disabled", false);
        }

        updateUi();
    });
    // 选择线文件路径
    $("#selectLinePath").click(function () {
        selectPath("LinePathSelected");
        if ("" != $("#referenceInput").val()) {
            $("#exportShape").attr("disabled", false);
        }

        updateUi();
    });
    // 选择点文件路径
    $("#selectPointPath").click(function () {
        selectPath("PointPathSelected");
        if ("" != $("#referenceInput").val()) {
            $("#exportShape").attr("disabled", false);
        }

        updateUi();
    });
    // 导出文件路径
    function selectPath(PathSelected) {
        //把OpenFileDialog修改为SaveFileDialog
        var filePath = earth.UserDocument.SaveFileDialog(earth.RootPath, "*.shp", "shp");
        if (filePath == "") {
            return;
        }
        var fileAry = filePath.split(".");

        if (fileAry[fileAry.length - 1] != "shp") {
            alert("文件格式不正确!");
            if (PathSelected == "PolygonPathSelected") {
                $("#savePolygonPath").attr("value", "");
            } else if (PathSelected == "LinePathSelected") {
                $("#saveLinePath").attr("value", "");
            } else if (PathSelected == "PointPathSelected") {
                $("#savePointPath").attr("value", "");
            }
            return;
        }
        if (PathSelected == "PolygonPathSelected") {
            $("#savePolygonPath").attr("value", filePath);
        } else if (PathSelected == "LinePathSelected") {
            $("#saveLinePath").attr("value", filePath);
        } else if (PathSelected == "PointPathSelected") {
            $("#savePointPath").attr("value", filePath);
        }
    }
    // 投影文件路径
    $("#addSpatialReference").click(function () {
        var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "spatial文件(*.spatial)|*.spatial");
        if (filePath == "") {
            return;
        }
        $("#referenceInput").attr("value", filePath);
        if ("" != $("#savePolygonPath").val() || "" != $("#saveLinePath").val() || "" != $("#savePointPath").val()) {
            $("#exportShape").attr("disabled", false);
        }
    });
    /**
     * 导出shape文件
     * @return {[type]} [description]
     */
    $("#exportShape").click(function () {
        polygonPath = $("#savePolygonPath").val();
        linePath = $("#saveLinePath").val();
        pointPath = $("#savePointPath").val();
        reference = $("#referenceInput").val();
        if ((polygonPath || linePath || pointPath) && reference) {
            var userdata = earth.userdata;
            var userdataDoc = userdata.getUserdata("MyPlace");
            if (earth.SelectSet && earth.SelectSet.GetCount() === 0) {
                if (confirm("确定导出?")) {
                    if ($('#polygoy').attr('checked') == 'checked') {
                        exportByType(userdata, userdataDoc, polygonPath.substring(0, polygonPath.lastIndexOf(".")), 211);
                    }
                    if ($('#line').attr('checked') == 'checked') {
                        exportByType(userdata, userdataDoc, linePath.substring(0, linePath.lastIndexOf(".")), 220);
                    }
                    if ($('#point').attr('checked') == 'checked') {
                        exportByType(userdata, userdataDoc, pointPath.substring(0, pointPath.lastIndexOf(".")), 209);
                    }
                    $("#exportShape").attr("disabled", true);
                } else {
                    $("#exportShape").attr("disabled", false);
                }
            } else {
                //只导出选中的对象
                var selectPolygon = [];
                var selectLine = [];
                var selectPoint = [];
                var count = earth.SelectSet.GetCount();
                if (count > 0) {
                    for (var i = count - 1; i >= 0; i--) {
                        var selectObj = earth.SelectSet.GetObject(i);
                        var elementDoc = userdata.getElementByGUID(userdataDoc, selectObj.Guid);
                        if (selectObj.rtti != 209) {
                            var coords = elementDoc.getElementsByTagName("Coordinates")[0].text;
                        }
                        if (selectObj.rtti === 209) {
                            var coords = elementDoc.getElementsByTagName("Position")[0].text;
                        }
                        if (coords) {
                            if (selectObj.rtti === 211) { //polygon
                                selectPolygon.push(coords);
                            } else if (selectObj.rtti === 220) { //line
                                selectLine.push(coords);
                            } else if (selectObj.rtti === 209) { //point
                                selectPoint.push(coords);
                            }
                        }
                    }
                    //导出选中对象
                    if (selectPolygon.length > 0) {
                        exportBySelected(selectPolygon, selectLine, selectPoint, polygonPath.substring(0, polygonPath.lastIndexOf(".")), 211);
                    }
                    if (selectLine.length > 0) {
                        exportBySelected(selectPolygon, selectLine, selectPoint, linePath.substring(0, polygonPath.lastIndexOf(".")), 220);
                    }
                    if (selectPoint.length > 0) {
                        exportBySelected(selectPolygon, selectLine, selectPoint, pointPath.substring(0, pointPath.lastIndexOf(".")), 209);
                    }
                }
            }
        } else {
            alert("请选择文件导出路径与投影文件!");
        }
    });

    function exportBySelected(selectPolygon, selectLine, selectPoint, filePath, type) {
        if (filePath) {
            if (type === 211) {
                var exp = STAMP.ExportSHP(earth, filePath, reference, selectPolygon, type);
            } else if (type === 220) {
                var exp = STAMP.ExportSHP(earth, filePath, reference, selectLine, type);
            } else if (type === 209) {
                var exp = STAMP.ExportSHP(earth, filePath, reference, selectPoint, type);
            }
            exp.exportFileToShape();
        }
    }

    $("#clear").click(function () {
        analysis.clearHtmlBallon(earth.htmlBallon);
    });

    /**
     * 全部导出辅助函数
     * @param  {[type]} userdata    [description]
     * @param  {[type]} userdataDoc [description]
     * @param  {[type]} type        [description]
     * @return {[type]}             [description]
     */
    function exportByType(userdata, userdataDoc, filePath, type) {
        var elements = userdata.getElementByType(userdataDoc, type);
        var polygonRings = [];
        if (elements && elements.length) {
            for (var i = elements.length - 1; i >= 0; i--) {
                if (type != 209) {
                    var coords = elements[i].getElementsByTagName("Coordinates")[0].text;
                }
                if (type === 209) {
                    var coords = elements[i].getElementsByTagName("Position")[0].text;
                }
                if (coords) {
                    polygonRings.push(coords);
                }
            }
            ;
            //导出所有对象到一个shape文件中 第三个参数类型为数组
            if (filePath) {
                var exp = STAMP.ExportSHP(earth, filePath, reference, polygonRings, type);
                exp.exportFileToShape();
            }
        } else {
            if (type === 211) {
                alert("没有面数据!");
            } else if (type === 220) {
                alert("没有线数据!");
            } else if (type === 209) {
                alert("没有点数据!");
            }
        }
    }
}
// 更新二维对象下dom结构
function updateUi() {
    function _enablePolygon(enabled) {
        if (enabled) {
            $('#lblXm').css({
                color: '#000000'
            });
            $('#selectPolygonPath').removeAttr('disabled');
            $('#selectPolygonPath').attr('src', '../../images/dialog/file.png');
        } else {
            $('#lblXm').css({
                color: '#c0c0c0'
            });
            $('#selectPolygonPath').attr('disabled', 'disabled');
            $('#selectPolygonPath').attr('src', '../../images/dialog/file3.png');
        }
    }

    function _enablePolyline(enabled) {
        if (enabled) {
            $('#lblXx').css({
                color: '#000000'
            });
            $('#selectLinePath').removeAttr('disabled');
            $('#selectLinePath').attr('src', '../../images/dialog/file.png');
        } else {
            $('#lblXx').css({
                color: '#c0c0c0'
            });
            $('#selectLinePath').attr('disabled', 'disabled');
            $('#selectLinePath').attr('src', '../../images/dialog/file3.png');
        }
    }

    function _enableSr(enabled) {
        if (enabled) {
            $('#lblX').css({
                color: '#000000'
            });
            $('#addSpatialReference').removeAttr('disabled');
            $('#addSpatialReference').attr('src', '../../images/dialog/file.png');
        } else {
            $('#lblX').css({
                color: '#c0c0c0'
            });
            $('#addSpatialReference').attr('disabled', 'disabled');
            $('#addSpatialReference').attr('src', '../../images/dialog/file3.png');
        }
    }

    function _enableExport(enabled) {
        if (enabled) {
            $('#exportShape').removeAttr('disabled');
        } else {
            $('#exportShape').attr('disabled', 'disabled');
        }
    }

    function _enablePoint(enabled) {
        if (enabled) {
            $('#lblXp').css({
                color: '#000000'
            });
            $('#selectPointPath').removeAttr('disabled');
            $('#selectPointPath').attr('src', '../../images/dialog/file.png');
        } else {
            $('#lblXp').css({
                color: '#c0c0c0'
            });
            $('#selectPointPath').attr('disabled', 'disabled');
            $('#selectPointPath').attr('src', '../../images/dialog/file3.png');
        }
    }

    isPolygonChecked = ($('#polygoy').attr('checked') == 'checked');
    isLineChecked = ($('#line').attr('checked') == 'checked');
    isPointChecked = ($('#point').attr('checked') == 'checked');
    if (isPolygonChecked || isLineChecked || isPointChecked) {
        //如果有一个选中，则投影变为可用
        _enableSr(true);
        if ($('#referenceInput').val() == '') {
            _enableExport(false);
        } else {
            _enableExport(true);
        }

        //谁选中，谁可用
        if (isPolygonChecked) {
            _enablePolygon(true);
        }
        if (isLineChecked) {
            _enablePolyline(true);
        }
        if (isPointChecked) {
            _enablePoint(true);
        }
    } else {//都未选中，则投影不可用
        _enablePolygon(false);
        _enablePolyline(false);
        _enablePoint(false);//point不可用
        _enableSr(false);
        _enableExport(false);
    }

}