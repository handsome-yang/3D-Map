/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：输入坐标,此弹框仅排管使用
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
var obj = window.dialogArguments;
var pipeDatum = obj.pipeDatum;
var earth = obj.earth;
var IsXYZ = false;
if (IsXYZ) {
    $("#x").html("X坐标（米）");
    $("#y").html("Y坐标（米）");
    $("#z").html("Z坐标（米）");
} else {
    $("#x").html("经度（度）");
    $("#y").html("纬度（度）");
    $("#z").html("地面高程（米）");
}

$("#serchL").click(function () {
    var tableObj = $("#textDiv table")[0];
    var selectIndex = tableObj.selectIndex;
    earth.Event.OnCreateGeometry = function (pval) {
        if (pval === null) {
            return;
        }
        tableObj.rows[selectIndex].cells[1].getElementsByTagName('input')(0).value = pval.Longitude.toFixed(8);
        tableObj.rows[selectIndex].cells[2].getElementsByTagName('input')(0).value = pval.Latitude.toFixed(8);
        tableObj.rows[selectIndex].cells[3].getElementsByTagName('input')(0).value = pval.Altitude.toFixed(2);
        earth.Event.OnCreateGeometry = function () {
        };
        earth.ShapeCreator.Clear();
    };
    earth.ShapeCreator.CreatePoint();
});
//经纬度、平面坐标的切换
$("#change").click(function () {
    if ($(this).text() === "经纬度坐标") {
        $(this).text("平面坐标");
        $("#x").html("经度（度）");
        $("#y").html("纬度（度）");
        $("#z").html("地面高程（米）");
        IsXYZ = false;
    } else {
        $(this).text("经纬度坐标");
        $("#x").html("X坐标（米）");
        $("#y").html("Y坐标（米）");
        $("#z").html("Z坐标（米）");
        IsXYZ = true;
    }
});
//增加一行
$("#add").click(function () {
    var tableObj = $("#textDiv table")[0];
    var num = tableObj.rows.length - 1;
    if (num == 2) {
        alert("不能再添加了");
        return;
    }
    var trHtml = getTrHtml(num);
    $("#textDiv table").append(trHtml);
    selectSingleRow($("#textDiv table")[0].rows[$("#textDiv table")[0].rows.length - 1].cells[0]);
});
//删除一行
$("#delete").click(function () {
    var tableObj = $("#textDiv table")[0];
    var selectIndex = tableObj.selectIndex;
    if (tableObj.rows.length === 1) {
        return;
    }
    tableObj.deleteRow(selectIndex);
    for (var i = selectIndex; i < tableObj.rows.length; i++) {
        tableObj.rows[i].cells[0].innerHTML = i;
    }
    $("#delete").attr("disabled", true);
});
//确定点击事件
$("#confirm").click(function () {
    var xyArr = [];
    var tableObj = $("#textDiv table")[0];
    if (tableObj.rows.length - 1 != 2) {
        alert("必须等于两个点");
        return;
    }
    for (var i = 1; i < tableObj.rows.length; i++) {
        if (tableObj.rows[i].cells[1].getElementsByTagName('input')(0).value === "" || tableObj.rows[i].cells[1].getElementsByTagName('input')(0).value === undefined) {
            if (IsXYZ) {
                alert("X坐标不能为空！");
            } else {
                alert("经度值不能为空！");
            }
            return;
        } else if (tableObj.rows[i].cells[2].getElementsByTagName('input')(0).value === "" || tableObj.rows[i].cells[2].getElementsByTagName('input')(0).value === undefined) {
            if (IsXYZ) {
                alert("Y坐标不能为空！");
            } else {
                alert("纬度值不能为空！");
            }
            tableObj.rows[i].focus();
            return;
        }
        else if (tableObj.rows[i].cells[3].getElementsByTagName('input')(0).value === "" || tableObj.rows[i].cells[3].getElementsByTagName('input')(0).value === undefined) {
            if (IsXYZ) {
                alert("Z坐标不能为空！");
            } else {
                alert("地面高程不能为空！");
            }
            tableObj.rows[i].focus();
            return;
        }
        if (isNaN(tableObj.rows[i].cells[1].getElementsByTagName('input')(0).value) || isNaN(tableObj.rows[i].cells[2].getElementsByTagName('input')(0).value) || isNaN(tableObj.rows[i].cells[3].getElementsByTagName('input')(0).value)) {
            alert("值必须是数字！");
            tableObj.rows[i].cells[2].focus();
            return;
        }
        if (!IsXYZ) {
            var x = tableObj.rows[i].cells[1].getElementsByTagName('input')(0).value;
            var y = tableObj.rows[i].cells[2].getElementsByTagName('input')(0).value;
            x = Math.abs(x);
            y = Math.abs(y);
            if (x > 180 || y > 90) {
                alert("请输入正确的经纬度坐标!");
                return;
            }
        }

        var params = {
            Longitude: parseFloat(tableObj.rows[i].cells[1].getElementsByTagName('input')(0).value),
            Latitude: parseFloat(tableObj.rows[i].cells[2].getElementsByTagName('input')(0).value),
            Altitude: parseFloat(tableObj.rows[i].cells[3].getElementsByTagName('input')(0).value)
        };
        xyArr.push(params);

    }
    if(xyArr[0].Longitude==xyArr[1].Longitude&&xyArr[0].Latitude==xyArr[1].Latitude&&xyArr[0].Altitude==xyArr[1].Altitude){
        alert("两个坐标不能是同一点");
        return;
    }

    if (IsXYZ) {
        xyArr = TranslateCoord(xyArr);//调用坐标转换方法
    }
    var centerLon = (xyArr[0].Longitude + xyArr[1].Longitude) / 2;
    var centerLat = (xyArr[0].Latitude + xyArr[1].Latitude) / 2;
    earth.GlobeObserver.GotoLookat(centerLon, centerLat, xyArr[0].Altitude + 50, 0.0, 89.0, 0, 4);
    obj.createPipeline(xyArr);
    window.close();
});
// 坐标转换
function TranslateCoord(arrCoord) {
    var arr = [];
    for (var i = 0; i < arrCoord.length; i++) {
        var rawPoint = pipeDatum.src_xy_to_des_BLH(arrCoord[i].Longitude, arrCoord[i].Latitude, arrCoord[i].Altitude);
        var params = {
            Longitude: rawPoint.X,
            Latitude: rawPoint.Y,
            Altitude: rawPoint.Z
        };
        arr.push(params);
    }
    return arr;
}
//取消事件
$("#giveup").click(function () {
    window.close();
});
/**
 * 参数：num - 编号
 * 返回：tr标签
 */
var getTrHtml = function (num) {
    var htmlStr = '<tr style="border: 1px double #cdcab8;"   >';
    htmlStr = htmlStr + '<td  onclick="selectSingleRow(this)">' + (num + 1) + '</td>';
    htmlStr = htmlStr + '<td  ondblclick="editTd(this)" ><input type="text" value=0 onkeyup="checkNum(this,false,null)" style="border: 0px;text-align: center;"></td>';
    htmlStr = htmlStr + '<td ondblclick="editTd(this)"><input type="text" value=0 onkeyup="checkNum(this,false,null)" style="border: 0px;text-align: center;"></td>';
    htmlStr = htmlStr + '<td ondblclick="editTd(this)"><input type="text" value=0 onkeyup="checkNum(this,false,null)" style="border: 0px;text-align: center;"></td>';
    htmlStr = htmlStr + '</tr>';
    return htmlStr;
};
/**
 * 功能：单行选择表中的某一行
 * 参数：obj - 选择的表单元格对象
 * 返回：无
 */
var selectSingleRow = function (trObj) {
    trObj = trObj.parentNode;
    trObj.blur();
    var tableObj = trObj.parentNode;
    for (var i = 0; i < tableObj.rows.length; i++) {
        tableObj.rows[i].style.color = "#000000";
        tableObj.rows[i].style.backgroundColor = "transparent";
    }
    trObj.style.color = "#ffffff";
    trObj.style.backgroundColor = "#316ac5";
    tableObj.parentNode.selectIndex = trObj.rowIndex;
    $("#delete").removeAttr("disabled");
    $("#serchL").removeAttr("disabled");
};
/**
 * 功能：单行选择表中的某一td
 * 参数：obj - 选择的表td对象
 * 返回：无
 */
var editTd = function (tdObj) {
    tdObj.focus();
    tdObj.parentNode.style.color = "";
    tdObj.parentNode.style.backgroundColor = "";

};