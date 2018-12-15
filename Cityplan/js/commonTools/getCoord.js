/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：坐标获取
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
// 接受三维球对象
function setTranScroll(earthObj){
    $("#select").click(function() {
        earthObj.Event.OnCreateGeometry = function(pval) {
            if (pval === null) {
                return;
            }
            var rawPoint = earthObj.pipeDatum.des_BLH_to_src_xy(pval.Longitude, pval.Latitude, pval.Altitude);
            $("#height").val(rawPoint.X.toFixed(2));
            $("#length").val(rawPoint.Y.toFixed(2));
            earthObj.Event.OnCreateGeometry = function() {};
            earthObj.ShapeCreator.Clear();
        };
        earthObj.ShapeCreator.CreatePoint();
    });

    $("#clear").click(function(){
        if (earthObj.htmlBallon != null){
            earthObj.htmlBallon.DestroyObject();
            earthObj.htmlBallon = null;
        }
        if(earthObj.Tools){
            earthObj.Tools.groupItemSelected("no", 4);    
        }
    });
}