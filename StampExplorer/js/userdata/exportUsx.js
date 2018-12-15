/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：导出USX
 * 注意事项：该文件方法仅为导出USX使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/
var earth="";
var polygon;
function getEarth(earthUsx){
    earth = earthUsx;
    var analysis = STAMP.Analysis(earth);
    //在建筑物、地形复选框不勾选，“选择范围”按钮为灰色不可操作状态
    $("input:checkbox[type=checkbox]").click(function(){
        var chk = $('input:checkbox[name="chkModel"]').is(":checked");
        var chkd = $('input:checkbox[name="chkDem"]').is(":checked");
        if ( !chk  && !chkd) {
            $("#btnStart").attr("disabled", "disabled");
        } else {
            $("#btnStart").removeAttr("disabled");
        }
    });
    $(function(){
        var selectTag="";
        var path=earth.RootPath+"\\temp\\" ;

        $("#btnStart").click(function(){
            if(check()){
                earth.Event.OnCreateGeometry = function(pGeo,type){
                    if(pGeo == null || pGeo.Count <= 2){
                        alert("至少绘制3个点！");
                        return;
                    }
                    polygon=pGeo;
                    checkExport();
                };
                earth.ShapeCreator.CreatePolygon();
            }
        });
        // 导出
        $("#export").click(function(){
            var exportPath = $("#path").val();
            if(exportPath === ""){
                alert("请选择路径保存路径")
                return;
            }
            $("#chkModel").attr("disabled", "disabled");
            $("#chkDem").attr("disabled", "disabled");
            $("#btnStart").attr("disabled", "disabled");
            $("#export").attr("disabled", "disabled");
            $("#clear").attr("disabled", "disabled");
            var startExport = function(){
                //msc转成obj
                var chk = $('input:checkbox[name="chkModel"]').is(":checked");
                var chkd = $('input:checkbox[name="chkDem"]').is(":checked");
                var dataProcess = document.getElementById("dataProcess");
                dataProcess.Load();
                var exportusx = dataProcess.ExportUsx;
                var coordFactory = dataProcess.CoordFactory;
                var datum = coordFactory.CreateDatum();
                var spatialRef = coordFactory.CreateSpatialRef();
                var spatial = $("#spatialFile").val();
                spatialRef.InitFromFile(spatial);
                datum.Init(spatialRef);
                exportusx.Datum = datum;
                //导出msc
                if(polygon){
                    earth.ShapeCreator.Clear();
                    //导出模型
                    if (chk) {
                        earth.TerrainManager.SaveModelMscDataByPolygon(polygon, path + "exportModelMsc.msc");
                        exportusx.ExportUsxFromMscFile(path+"exportModelMsc.msc", exportPath+"\\");
                    };
                    //导出dem
                    if (chkd) {
                        earth.TerrainManager.SaveDemMscDataByPolygon(polygon, path + "exportDemMsc.msc", 24);
                        exportusx.ExportUsxFromMscFile(path+"exportDemMsc.msc", exportPath+"\\");
                    };
                    alert("导出成功!");
                    $("#chkModel").attr("disabled", false);
                    $("#chkDem").attr("disabled", false);
                    $("#btnStart").attr("disabled", false);
                    $("#export").attr("disabled", true);
                    $("#clear").attr("disabled", false);
                }
                else{
                    $("#chkModel").attr("disabled", false);
                    $("#chkDem").attr("disabled", false);
                    $("#btnStart").attr("disabled", false);
                    $("#export").attr("disabled", false);
                    $("#clear").attr("disabled", false);
                }
            }
            //导出延时执行，等待ui已经响应完毕之后才执行activex中的过程，防止阻塞
            setTimeout(function() {
                startExport();
            }, 200);
        });
    }) ;


//打开保存路径
    $("#addLink").click(function() {
        var filePath = earth.UserDocument.OpenFilePathDialog("", "");
        if (filePath == "")
            return;
        document.getElementById("path").value = filePath;
        if(""!=document.getElementById("spatialFile").value){
            document.getElementById("btnStart").disabled = false;
        }
        checkExport();
    });

//打开空间参考文件路径
    $("#openspatialLink").click(function() {
        var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath,"投影文件(*.spatial)|*.spatial");
        if (filePath == "")
            return;
        document.getElementById("spatialFile").value = filePath;
        if(""!=document.getElementById("path").value){
            document.getElementById("btnStart").disabled = false;
        }
        checkExport();
    });
    $("#clear").click(function(){
        analysis.clearHtmlBallon(earth.htmlBallon);
    });
    earth.Event.OnHtmlBalloonFinished= function () {
        analysis.clear();
    };
}
function check(){
    var path = document.getElementById("path").value;
    if("" == path){
        alert("请选择存储路径！");
        return false;
    }
    var spatialFile = document.getElementById("spatialFile").value;
    if("" == spatialFile){
        alert("请选择投影文件！");
        return false;
    }
    return true;
}
function checkExport(){
    var exportPath = $("#path").val();
    var spatial = $("#spatialFile").val();
    if (exportPath && spatial && polygon) {
        $("#export").removeAttr("disabled");
    }
}