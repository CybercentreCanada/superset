/*import TextToNumericFormatV6 from './TextToNumericFormatV6';*/

/**
 * Code copied from sun.
 */
 class IPAddressUtil
 {
     static INADDR4SZ = 4;

     /**
      * Converts IPv4 address in its textual presentation form into its numeric
      * binary form.
      * 
      * @param src a String representing an IPv4 address in standard format
      * @return a byte array representing the IPv4 numeric address
      */
     static textToNumericFormatV4(src: string)
     {
        var res = null;
        console.log("In ipaddressutils")
         if (src.length !== 0)
         {
             var s = src.split(".", -1);
             try
             {
                 switch (s.length)
                 {
                     case 1:
                         res = this.onePart(s);
                         break;
                     case 2:
                         res = this.twoPart(s);
                         break;
                     case 3:
                         res = this.threePart(s);
                         break;
                     case 4:
                         res = this.fourPart(s);
                         break;
                     default:
                         // If we have more than 5 parts like 12.12.12.12.12 we
                         // bail.
                 }
             }
             catch (e)
             {
                 // Leaving setting the buffer to null in case the execption was
                 // thrown after it was assigned.
                 res = null;
                 console.log(e);
             }
         }
         return (res === null) ? null : res.getUint32(0);
     }

     /**
      * When four parts are specified, each is interpreted as a byte of data and
      * assigned, from left to right, to the four bytes of an IPv4 address.
      * 
      * @param s an array of String parts representing an IPv4 address in
      *            standard format.
      * @return the four bytes of an IPv4 address.
      */
     static fourPart(s: string[])
     {
         let buffer = new ArrayBuffer(this.INADDR4SZ);
         let view = new DataView(buffer);
         for (let i = 0; i < 4; i++)
         {
             let val = parseInt(s[i]);
             if (val < 0 || val > 0xff)
             {
                 return null;
             }
             view.setUint8(i, (val & 0xff));
         }
         return view;
     }

     /**
      * When a three part address is specified, the last part is interpreted as a
      * 16-bit quantity and placed in the right most two bytes of the network
      * address. This makes the three part address format convenient for
      * specifying Class B net- work addresses as 128.net.host.
      * 
      * @param s an array of String parts representing an IPv4 address in
      *            standard format.
      * @return the four bytes of an IPv4 address.
      */
     static threePart(s: string[])
     {
         let buffer = new ArrayBuffer(this.INADDR4SZ);
         let view = new DataView(buffer);
         let val;
         for (let i = 0; i < 2; i++)
         {
             val = parseInt(s[i]);
             if (val < 0 || val > 0xff)
             {
                 return null;
             }
             view.setUint8(i, (val & 0xff));
         }

         if (view != null)
         {
             val = parseInt(s[2]);
             if (val < 0 || val > 0xffff)
             {
                 return null;
             }
             else
             {
                 view.setUint16(2, val);
             }
         }
         return view;
     }

     /**
      * When a two part address is supplied, the last part is interpreted as a
      * 24-bit quantity and placed in the right most three bytes of the network
      * address. This makes the two part address format convenient for specifying
      * Class A network addresses as net.host.
      * 
      * @param s an array of String parts representing an IPv4 address in
      *            standard format.
      * @return the four bytes of an IPv4 address.
      */
     static twoPart(s: string[])
     {
         let buffer = new ArrayBuffer(this.INADDR4SZ);
         let view = new DataView(buffer);
         let val = parseInt(s[0]);
         if (val < 0 || val > 0xff)
         {
             return null;
         }
         else
         {
             view.setUint8(0, (val & 0xff));
             val = parseInt(s[1]);
             if (val < 0 || val > 0xffffff)
             {
                 return null;
             }
             else
             {
                 view.setUint8(1, ((val >> 16) & 0xff));
                 view.setUint16(2, (val & 0xffff));
             }
         }
         return view;
     }

     /**
      * When only one part is given, the value is stored directly in the network
      * address without any byte rearrangement.
      * 
      * @param s an array of String parts representing an IPv4 address in
      *            standard format.
      * @return the four bytes of an IPv4 address.
      */
     static onePart(s: string[])
     {
         let buffer = new ArrayBuffer(this.INADDR4SZ);
         let view = new DataView(buffer);
         let val = parseInt(s[0]);
         if (val < 0 || val > 0xffffffff)
         {
             return null;
         }
         else
         {
             view.setUint32(0, val);
         }
         return view;
     }

     /**
      * @param src a String representing an IPv4 address in textual format
      * @return a boolean indicating whether src is an IPv4 literal address
      */
     static isIPv4LiteralAddress(src: string)
     {
         return this.textToNumericFormatV4(src) != null;
     }

     /**
      * @param src a String representing an IPv6 address in textual format
      * @return a boolean indicating whether src is an IPv6 literal address
      */
     /*static isIPv6LiteralAddress(src)
     {
         return this.textToNumericFormatV6(src) != null;
     }
 
     static textToNumericFormatV6(src)
     {
         return new TextToNumericFormatV6(src).getBytes();
     }*/

     /*
      * Convert IPv4-Mapped address to IPv4 address. Both input and returned
      * value are in network order binary form.
      * @param src a String representing an IPv4-Mapped address in textual format
      * @return a byte array representing the IPv4 numeric address, prefixed by
      * 0xffff
      */
     /*public static byte[] convertFromIPv4MappedAddress(byte[] addr)
     {
         if (isIPv4MappedAddress(addr))
         {
             byte[] newAddr = new byte[INADDR4SZ + 2];
             System.arraycopy(addr, 10, newAddr, 0, INADDR4SZ + 2);
             return newAddr;
         }
         return null;
     }*/

     /**
      * Utility routine to check if the InetAddress is an IPv4 mapped IPv6
      * address.
      * 
      * @return a <code>boolean</code> indicating if the InetAddress is an IPv4
      *         mapped IPv6 address; or false if address is IPv4 address.
      */
     /*private static boolean isIPv4MappedAddress(byte[] addr)
     {
         boolean ret = false;
         if (addr.length >= INADDR16SZ)
         {
             // Test bytes 0 to 9 are zero.
             boolean allZeros = true;
             for (int i = 0; i < 10; i++)
             {
                 if (addr[i] != BYTE_ZERO)
                 {
                     allZeros = false;
                     break;
                 }
             }
 
             if (allZeros)
             {
                 // Test byte 10 and 11 are FF.
                 if (addr[10] == BYTE_FF && addr[11] == BYTE_FF)
                 {
                     ret = true;
                 }
             }
         }
 
         return ret;
     }*/

 }

 export default IPAddressUtil;
 