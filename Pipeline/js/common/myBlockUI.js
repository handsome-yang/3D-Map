jQuery.blockUI=function(jqueryObject,backgroundColor){
	/**
	lenght1是为屏蔽内容的宽度
	lenght2为提示框的宽度
	**/
	findMiddle=function(length1,length2){
		if(length1>length2)
		{
			return (length1-length2)/2;
			}
			else if(length1<length2){
				return -(length2-length1)/2
				}else {
					return 0;
					}
		}
	this.defaultBackgroundColor="#DFDFDF";
	if(backgroundColor)
	{
		this.defaultBackgroundColor=backgroundColor;
		}
	this.defaultBackgroundColor = "#eef5fd";
	this.top=0;
	this.left=0;
    if(!jQuery.checkType.isNull(jqueryObject)&&jQuery.checkType.isObject(jqueryObject)){
        this.blockMask = $("<div style=' position:absolute; display:none;  z-index:300; background-color:"+this.defaultBackgroundColor+"; filter:alpha(opacity=50); -moz-opacity:0.5;  -khtml-opacity: 0.5;  opacity: 0.5;' />").css("width",jqueryObject.width()).css("top",jqueryObject.offset().top).css("left",jqueryObject.offset().left).css("height",jqueryObject.height());
        $(divObj).parent().append(this.blockMask);
        this.top=jqueryObject.offset().top;
        this.left=jqueryObject.offset().left;
    }else{
        //this.blockMaskbottom = $("<div style='width:100%; position:absolute; top:0px; display:none; left:0px; z-index:400; height:100%; background-color:"+this.defaultBackgroundColor+"; filter:alpha(opacity=50); -moz-opacity:0.5;  -khtml-opacity: 0.5;  opacity: 0.5;' />");
        var divObj =parent.document.getElementById("northDiv");
        this.blockMask1 = $("<div style=' position:absolute; display:none;  z-index:300; background-color:"+this.defaultBackgroundColor+"; filter:alpha(opacity=50); -moz-opacity:0.5;  -khtml-opacity: 0.5;  opacity: 0.5;' />").css("width",$(divObj).width()).css("top",$(divObj).offset().top).css("left",$(divObj).offset().left).css("height",$(divObj).height());
        $(divObj).parent().append(this.blockMask1);
        this.blockMask = $("<div style='width:100%; position:absolute; top:0px; display:none; left:0px; z-index:300; height:100%; background-color:"+this.defaultBackgroundColor+"; filter:alpha(opacity=50); -moz-opacity:0.5;  -khtml-opacity: 0.5;  opacity: 0.5;' />");
        $("body").append(this.blockMask);

	}
    this.blockMask.attr("class","blockMask_JQUERY_BLOCK");
    this.blockMask1.attr("id","blockMask1");

    this.message=$("<img src='../../image/hc.gif' width='45' height='45' >");
    this.message.hide();
    this.message.css({
        position:"absolute",
        top:findMiddle(this.blockMask.height(),this.message.height())+this.top,
        left:50
    }).css("z-index",this.blockMask.css("z-index")+1);
    this.message.attr("class","message_JQUERY_BLOCK");
    this.blockMask.show();
    this.message.show();
    this.blockMask1.show();
    $("body").append(this.message);
    return ;
						
}
	/**
	取消屏蔽
	**/
jQuery.unBlock=function(){
	$(".blockMask_JQUERY_BLOCK").hide();
	$(".message_JQUERY_BLOCK").hide();
    //$(".blockMask_JQUERY_BLOCK1").hide();
    if(parent.blockMask1){
        $(parent.blockMask1).hide();
    }

}
	
	jQuery.checkType={
	isArray:function(obj){
		return (typeof obj=='object')&&obj.constructor==Array;
		},
	isString:function(obj){
		return (typeof str=='string')&&str.constructor==String;
		},
	isNumber:function(obj){
		return (typeof obj=='number')&&obj.constructor==Number;
		},
	isDate:function(obj){
		return (typeof obj=='object')&&obj.constructor==Date;
		},
	isFunction:function(obj){
		return (typeof obj=='function')&&obj.constructor==Function;
		},
	isObject:function(obj){
		return (typeof obj=='object')&&obj.constructor==Object;
		},
	isNull:function(obj){
		  return obj===null || !obj ||typeof obj=='undefine';
		}
		
	}