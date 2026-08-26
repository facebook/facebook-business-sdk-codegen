/**
* Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
*
* You are hereby granted a non-exclusive, worldwide, royalty-free license to
* use, copy, modify, and distribute this software in source code or binary
* form for use in connection with the web services and APIs provided by
* Facebook.
*
* As with any software that integrates with the Facebook platform, your use
* of this software is subject to the Facebook Developer Principles and
* Policies [http://developers.facebook.com/policy/]. This copyright notice
* shall be included in all copies or substantial portions of the software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
* THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*
*/

using System.Collections.Generic;
using System.Web.Script.Serialization;

namespace Facebook.Ads.SDK
{
  public class APINode : IAPIResponse
  {
    protected string rawValue = null;

    public APIContext Context
    {
      get; set;
    }

    // TODO: This is a hack to allow raw dictionary data access.
    public Dictionary<string, object> Data
    {
      get;
      protected set;
    }

    public APIException Exception
    {
      get { return null; }
    }

    public string ToRawResponse()
    {
      return rawValue;
    }

    public APINode Head()
    {
      return null;
    }

    public static APINodeList<APINode> ParseResponse(string json, APIContext context, APIRequest<APINode> request)
    {
      // TODO: implement
      return null;
    }

    public static APINode LoadFromDictionary(dynamic dict)
    {
      var node = new APINode();
      node.Data = dict;
      return node;
    }

    public static dynamic SerializeJSON(string json)
    {
        var serializer = new JavaScriptSerializer();
        serializer.MaxJsonLength = 20971520; // increase the limit to 40MB.
        return serializer.DeserializeObject(json);
    }
  }
}
