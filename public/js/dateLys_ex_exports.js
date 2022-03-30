// kullanım 1:
// Fonk1:
exports.CurrentDate=getCurrentDate;

/* NODE JS te,
   Yazılan her bir ayrı .js uzantılı dosya JS'de bir modul olarak ele alınıyor.
   Yazılan fonksiyonlar başka bir .js dosyada kullanılmak üzeere export edilmesi gerekiyor.
   Export ilşlemi js object olarak yapılıyor. Yani getCurrentDate() fonksiyonu yukarıdaki
   şekilde export edildiğinde modulün CurrentDate objesinde tutuluyor. 

        const getWorkDay=require(__dirname+"/dateLys.js");

    şeklinde .js uzantılı dosyaya dahil edildiğinde getWorkDay sabitine dateLys.js modülünden
    object atanmış oluyor.
    
    Objenin elemanının değerine ulaşmak için de ;

        const day=getWorkDay.CurrentDate();
    
    şeklinde bir ifade yazmak gerekmektedir.


*/

function getCurrentDate() {

    var today = new Date();
    var options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    };
                                            // options yerine ;
                                            // sadece object olarakta giriş yapılabilir.
    var day = today.toLocaleString('tr-TR', options); //today.getDay();

    return day;

}

//Fonk2:
exports.CurrentDay=getCurrentDay;

function getCurrentDay() {

    var today = new Date();
    var options = {
        weekday: 'long',
    };
    var day = today.toLocaleString('tr-TR', options); //today.getDay();

    return day;

}