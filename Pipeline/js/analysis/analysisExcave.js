/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：开挖分析js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var bShow = false;//是否显示详细信息
var isShowResult = false; //是否是点击显示结果按钮
$(function () {
    setDivHeight();
    earth = top.LayerManagement.earth;
    var hideHigh = [];
    var projectId = top.SYSTEMPARAMS.project;
    var excavePolygon = "";
    //判断各项输入是否符合要求来对按钮实施禁用
    var validation = function () {
        var txtBufferDist = $("#txtBufferDist").val();
        var txtDepth = $("#txtDepth").val();
        if ((!parseInt(txtBufferDist) && parseInt(txtBufferDist) != 0) || (!parseInt(txtDepth) && parseInt(txtDepth) != 0)) {
            $("#roadClip").attr("disabled", true);
            $("#customClip").attr("disabled", true);
            $("#writerCoord").attr("disabled", true);
            $("#importShp").attr("disabled", true);
        } else {
            $("#roadClip").attr("disabled", false);
            $("#customClip").attr("disabled", false);
            $("#writerCoord").attr("disabled", false);
            $("#importShp").attr("disabled", false);
        }
    };
    /**
     * 开挖半径输入控制
     */
    $("#txtBufferDist").keyup(function () {
        checkNum($("#txtBufferDist")[0], true, 2, 50);
        validation();
    });
    /**
     * 开挖深度输入控制
     */
    $("#txtDepth").keyup(function () {
        checkNum($("#txtDepth")[0], true, 2, 6000);
        validation();
    });
    /**
     * 沿路开挖点击事件
     */
    $("#roadClip").click(function () {
        var depth = $("#txtDepth").val();
        var dist = $("#txtBufferDist").val();
        depth = Number(depth);
        if (depth <= 0 || depth == NaN) {
            alert("请输入合理的开挖深度");
            return;
        }
        dist = Number(dist);
        dist = dist == NaN ? 0 : dist;
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            TerrainExcavate.highlightObjectFromTunnel(false);
            $("#showResult").attr("checked", false);
        }
        $("#tblResult>tbody").empty();

        var checkTag = $('input:checkbox[name="checkInfo"]').is(":checked");
        var checkExcave = $('input:checkbox[name="checkExcave"]').is(":checked");
        TerrainExcavate.roadClipAnaly(depth, 12, dist, projectId, $("#tblResult>tbody"), $("#showResult"), $("#importExcelBtn"), checkTag, checkExcave, $("#analysis"));
    });
    /**
     * 自定义开挖点击事件
     */
    $("#customClip").click(function () {
        var depth = $("#txtDepth").val();
        depth = Number(depth);
        if (depth <= 0 || depth == NaN) {
            alert("请输入合理的开挖深度");
            return;
        }
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            TerrainExcavate.highlightObjectFromTunnel(false);
            $("#showResult").attr("checked", false);
        }
        $("#tblResult>tbody").empty();

        var checkTag = $('input:checkbox[name="checkInfo"]').is(":checked");
        var checkExcave = $('input:checkbox[name="checkExcave"]').is(":checked");
        TerrainExcavate.customClipAnaly(depth, 12, projectId, $("#tblResult>tbody"), $("#showResult"), $("#importExcelBtn"), checkTag, checkExcave, $("#analysis"));
    });
    /**
     * 输入坐标开挖点击事件
     */
    $("#writerCoord").click(function () {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            TerrainExcavate.highlightObjectFromTunnel(false);
            $("#showResult").attr("checked", false);
        }
        $("#tblResult>tbody").empty();
        TerrainExcavate.deleteTempTerrainAnaly();
        var pointArr = [];
        var obj = {};
        obj.pipeDatum = top.SYSTEMPARAMS.pipeDatum;
        pointArr = showModalDialog("../../html/analysis/editTable.html", obj, "dialogWidth=425px;dialogHeight=320px;status=no");
        if (pointArr === undefined || pointArr.length <= 0 || pointArr === null) {
            return;
        }
        var vec3s = earth.Factory.CreateVector3s();
        for (var i = 0; i < pointArr.length; i++) {
            var vAltitude = earth.Measure.MeasureTerrainAltitude(pointArr[i].x, pointArr[i].y);
            vec3s.Add(pointArr[i].x, pointArr[i].y, vAltitude);
        }
        var depth = $("#txtDepth").val();
        var checkTag = $('input:checkbox[name="checkInfo"]').is(":checked");
        var checkExcave = $('input:checkbox[name="checkExcave"]').is(":checked");
        TerrainExcavate.importClipAnaly(vec3s, depth, 12, projectId, $("#tblResult>tbody"), $("#showResult"), $("#importExcelBtn"), checkTag, checkExcave, $("#analysis"));
        earth.GlobeObserver.GotoLookat(pointArr[0].x, pointArr[0].y, earth.Measure.MeasureTerrainAltitude(pointArr[0].x, pointArr[0].y) + 50, 0.0, 89.0, 0, 4);
    });
    /**
     * 导入shp点击事件
     */
    $("#importShp").click(function () {
        var obj = {};
        obj.earth = earth;
        obj.polygon = "";
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            TerrainExcavate.highlightObjectFromTunnel(false);
            $("#showResult").attr("checked", false);
        }
        TerrainExcavate.deleteTempTerrainAnaly();
        $("#tblResult>tbody").empty();
        showModalDialog("../../html/analysis/importVector.html", obj, "dialogWidth=325px;dialogHeight=170px;status=no");
        if (obj.polygon === "" || obj.polygon === undefined || obj.polygon.Count <= 0) {
            return;
        }
        var depth = $("#txtDepth").val();
        var checkTag = $('input:checkbox[name="checkInfo"]').is(":checked");
        var checkExcave = $('input:checkbox[name="checkExcave"]').is(":checked");
        TerrainExcavate.importClipAnaly(obj.polygon, depth, 12, projectId, $("#tblResult>tbody"), $("#showResult"), $("#importExcelBtn"), checkTag, checkExcave, $("#analysis"));
    });
    //分析点击事件
    $("#analysis").click(function () {
        divload("tablediv");
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            TerrainExcavate.highlightObjectFromTunnel(false);
            $("#showResult").attr("checked", false);
        }
        $("#tblResult>tbody").empty();
        TerrainExcavate.roadAnalysis();
        if ("" == $("#tblResult>tbody").text()) {
            alert("分析结果为空！");
        }
        divloaded();
        //统计可用
        $("#sBtn").attr("disabled", false);
        $("#detailData").attr("disabled", false);
    });
    /**
     * 显示结果点击事件
     */
    $("#showResult").click(function () {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            isShowResult = true;
            checkTag = "true";
            TerrainExcavate.highlightObjectFromTunnel(checkTag);
        } else {
            TerrainExcavate.highlightObjectFromTunnel(false);
        }
        isShowResult = false;
    });
    //显示详细信息
    $("#detailData").click(function () {
        bShow = $('input:checkbox[name="detailData"]').is(":checked");
        if (!bShow) {
            top.LayerManagement.clearHtmlBalloons();
        }
    });
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        var tabObj = $("#tblResult>tbody")[0];
        var columns = ["编号", "类型", "图层"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    $(window).unload(function () {
        clearHtmlBal();
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            TerrainExcavate.highlightObjectFromTunnel(false);
        }
        TerrainExcavate.deleteTempTerrainAnaly();//删掉临时地形
        TerrainExcavate.clearHighLight();
        StatisticsMgr.detachShere();
    });

    //统计功能
    var htmlBal = null;
    $("#sBtn").die().live("click", function () {
        clearHtmlBal();
        var href = window.location.href;
        var newHref = href.replace("html/analysis/AnalysisExcave.html", "")
        newHref += "html/analysis/chart.html";
        var id = earth.Factory.CreateGuid();
        htmlBal = earth.Factory.CreateHtmlBalloon(id, "统计图");
        htmlBal.SetScreenLocation(0, 0);
        htmlBal.SetRectSize(750, 480);
        htmlBal.SetIsAddCloseButton(true);
        htmlBal.SetIsAddMargin(true);
        htmlBal.SetBackgroundAlpha(150);//这里怎么调整为半透明效果呢
        htmlBal.ShowNavigate(newHref);
        var classResList = TerrainExcavate.getResultArr();
        var newVals = fieldClassification(classResList);
        earth.Event.OnDocumentReadyCompleted = function () {
            if (htmlBal === null) {
                return;
            }
            var jsonStrData = JSON.stringify(newVals);
            htmlBal.InvokeScript("getAnalysisData", jsonStrData);
        };
    });
    /*
     * 清除统计图页面
     */
    var clearHtmlBal = function () {
        if (htmlBal != null && top.earth != null) {
            htmlBal.DestroyObject();
            htmlBal = null;
        }
    };
    /**
     * 记录数组中重复元素出现的次数(无序)
     */
    var getTimes = function (array, vars) {
        var temp = new ActiveXObject("Scripting.Dictionary");
        var dic = new ActiveXObject("Scripting.Dictionary");
        var len = new ActiveXObject("Scripting.Dictionary");
        for (var i = 0; i < array.length; i++) {
            var value = array[i];
            if (temp.item(value)) {
                dic.item(value)++;
                len.item(value) += vars[i].length;
            } else {
                temp.item(value) = value;
                len.item(value) = vars[i].length;
                var t = 1;
                dic.item(value) = t;
            }
        }
        return {dic: dic, len: len};
    };
    /**
     * 统计
     * @param classResList 统计的数组
     * @returns {Array}
     */
    var fieldClassification = function (classResList) {
        var temp = [];
        var layers = [];
        var fields;
        fields = [{dataType: "图层"}, {dataNum: "数量"}, {length: "长度"}];
        var chartTitle = "开挖统计图";
        var layerNS = new ActiveXObject("Scripting.Dictionary");
        var guidToLength = [];
        var guids = [];
        for (var i = 0; i < classResList.length; i++) {
            layerNS.item(classResList[i].guid) = classResList[i].name;
            guidToLength.push({
                guid: classResList[i].guid,
                length: (classResList[i].record.SHAPE.Polyline ? Number(classResList[i].record.SHAPE.Polyline.Length) : 0)
            });
            guids.push(classResList[i].guid);
        }

        var obj = getTimes(guids, guidToLength);
        var keys = layerNS.Keys().toArray();
        for (var t = 0; t < keys.length; t++) {
            var guid = keys[t];
            if (guid) {
                var layerId = guid;
                var layerName = layerNS.item(guid);
                layers.push(layerName);
                var classLayer = {
                    chartTitle: chartTitle,
                    layer: layers,
                    fields: fields,
                    layerName: layerName,
                    dataList: [
                        {layerName: layerName}
                    ]
                };
                //这里要计算每一个图层的管线长度
                classLayer.dataList.push({
                    dataType: "小计",
                    dataNum: obj.dic.item(guid),
                    length: obj.len.item(guid).toFixed(3)
                });
                temp.push(classLayer);
            }
        }
        return temp;
    };
});