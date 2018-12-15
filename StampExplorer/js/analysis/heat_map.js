/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：设置等高线
 * 注意事项：该文件方法仅为热力图使用
 * 遗留bug ：无
 * 修改日期：2017年11月07日
 *****************************************************************/
var earth, analysis;
// 对value值进行判断
function validation() {
    var filePath = $("#filePath").val();
    if (!filePath) {
        alert("请选取文件");
        return false;
    }
    var radius = $("#radius").val();
    if (isNaN(parseFloat(radius))) {
        alert("请输入正确的半径值");
        return false;
    }
    var density = $("#density").val();
    if (isNaN(parseFloat(density))) {
        alert("请输入正确的密度值");
        return false;
    }
    var altitude = $("#altitude").val();
    if (isNaN(parseFloat(altitude))) {
        alert("请输入正确的海拔值");
        return false;
    }
    return true;
}
// 选取文件路径
function getFilePath(id) {
    var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "txt文件(*.txt)|*.txt");
    if (filePath == "") {
        return;
    }
    $("#" + id).attr("value", filePath);
}
function getEarth(earthObj) {
    earth = earthObj;
    analysis = STAMP.Analysis(earth);
}
$(function () {
    $("#tableLines").mCustomScrollbar();
    $("#slopeTable td").css({
    	"width": "60px",
    	"white-space": "nowrap",
    	"overflow": "hidden",
    	"word-break": "keep-all"
    });

    $("#btnSet").click(function () {
        analysis.clear();
        var checkLegal = validation();
        if (!checkLegal) {
            return;
        }
        var terrainCheck = $("#terrain").val();
        terrainCheck = (terrainCheck == "1") ? true : false;
        analysis.createHeatMap($("#filePath").val(),
            parseFloat($("#radius").val()),
            parseFloat($("#density").val()),
            parseFloat($("#altitude").val()),
            terrainCheck, "slopeTable");
    });
    $("#fileButton").click(function () {
        getFilePath("filePath");
        $("#btnSet").attr("disabled", false);
    });
    $("#getAltBtn").click(function () {
        document.getElementById("getAltBtn").style.cursor = "crosshair";
        analysis.getAltitude(function (val) {
            $("#altitude").val(val);
        });
        earth.Event.OnLBUp = function (p) {
            document.getElementById("getAltBtn").style.cursor = "auto";
            earth.Event.OnLBUp = function () {
            };
        };
    })
    $("#btnSet").attr("disabled", true);
    // “分段全值”按钮点击事件
    $('#sectionBtn').on('click', function (e) {
        var gradeSection = $('#gradeSection').val();
        if (gradeSection == "" || parseInt(gradeSection) < 2) {
            alert("分段必须大于1！请重新输入！");
            $('#gradeSection').val(2);
            $("#btnSet").attr("disabled", true);
            return;
        } else {
            $("#btnSet").attr("disabled", false);
        }
        var secAngle = parseFloat(1 / (gradeSection - 1)).toFixed(2);
        $("#slopeTable").empty();
        for (var i = 0; i < gradeSection; i++) {
            var trHTML = "<tr><td>" + (i * secAngle).toFixed(2) + "</td><td><input type='text' id='fillColor" + i + "' value='#00ff00' class='colorInput' readonly/> <input type='button' id='fillColorSel" + i + "' class='colorBtn' style='background-color:#00ff00' class='button' value='' onClick='fillColorDlg(" + '"fillColorSel' + i + '")' + "' /></td></tr>";
            $(trHTML).appendTo("#slopeTable");
        }
        $("#slopeTable td").css({
        	"width": "60px",
        	"overflow": "hidden",
        	"white-space": "nowrap",
        	"word-break": "keep-all"
        });
    });
    // 权值分段改变事件
    document.getElementById("gradeSection").onpropertychange = function () {
        $("#btnSet").attr("disabled", true);
        checkNum($("#gradeSection")[0], true, 0);
        var secValue = $("#gradeSection").val();
        if (parseInt(secValue) < 2) {
            $("#gradeSection").val(2);
        }
    }
    window.onunload = function () {
        analysis.clear();
    }
    $("#clear").click(function () {
        analysis.clear();
        earth.htmlBallon.DestroyObject();
    });
})