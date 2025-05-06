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

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace Facebook.Ads.SDK
{
  public abstract class APIRequest<T> where T : APINode
  {
    protected string nodeId;
    protected string endpoint;
    protected string method;
    protected List<string> paramNames;
    protected IResponseParser<T> parser;
    protected IDictionary<string, object> parameters = new Dictionary<string, object>();

    protected List<string> returnFields;
    public const string USER_AGENT = APIConfig.USER_AGENT;
    protected static IDictionary<string, string> fileToContentTypeMap = new Dictionary<string, string>
    {
      {".atom", "application/atom+xml"},
      {".rss", "application/rss+xml"},
      {".xml", "application/xml"},
      {".csv", "text/csv"},
      {".txt", "text/plain"}
    };

    public APIRequest(APIContext context, string nodeId, string endpoint, string method)
      : this(context, nodeId, endpoint, method, null, null)
    {
    }

    public APIRequest(APIContext context, string nodeId, string endpoint, string method, IResponseParser<T> parser)
      : this(context, nodeId, endpoint, method, null, parser)
    {
    }

    public APIRequest(APIContext context, string nodeId, string endpoint, string method, IEnumerable<string> paramNames)
      : this(context, nodeId, endpoint, method, paramNames, null)
    {
    }

    public APIRequest(APIContext context, string nodeId, string endpoint, string method, IEnumerable<string> paramNames, IResponseParser<T> parser)
    {
      this.Context = context;
      this.nodeId = nodeId;
      this.endpoint = endpoint;
      this.method = method;
      this.paramNames = new List<string>(paramNames);
      this.parser = parser;
    }

    public abstract bool IsCollectionResponse
    {
      get;
    }

    public APINodeList<T> LastResponse
    {
      get;
      protected set;
    }

    public APIContext Context
    {
      get;
      protected set;
    }

    protected abstract APINodeList<T> ParseResponse(string response);

    public APINodeList<T> Execute()
    {
      return this.Execute(new Dictionary<string, object>());
    }

    public APINodeList<T> Execute(Dictionary<string, object> extraParams)
    {
      this.LastResponse = this.ParseResponse(this.SendRequest(extraParams));
      return this.LastResponse;
    }

    private string GetApiUrl()
    {
      return this.Context.EndpointBase + "/" + this.Context.Version + "/" + this.nodeId + this.endpoint;
    }

    protected string SendRequest(Dictionary<string, object> extraParams)
    {
      // extraParams are one-time params for this call,
      // so that the APIRequest can be reused later on.
      string response = null;
      if ("GET".Equals(this.method, StringComparison.Ordinal))
      {
        response = SendGet(this.GetApiUrl(), GetAllParams(extraParams), this.Context);
      }
      else if ("POST".Equals(this.method, StringComparison.Ordinal))
      {
        response = SendPost(this.GetApiUrl(), GetAllParams(extraParams), this.Context);
      }
      else if ("DELETE".Equals(this.method, StringComparison.Ordinal))
      {
        response = SendDelete(this.GetApiUrl(), GetAllParams(extraParams), this.Context);
      }
      else
      {
        var message = "Unsupported http method. Currently only GET, POST, and DELETE are supported";
        throw new APIException(message, new ArgumentException(message));
      }
      return response;
    }

    // HTTP GET request
    private static string SendGet(string apiUrl, Dictionary<string, object> allParams, APIContext context)
    {
      var sb = new StringBuilder(apiUrl);
      bool firstEntry = true;
      foreach (var entry in allParams)
      {
        sb.Append(firstEntry ? "?" : "&")
          .Append(WebUtility.UrlEncode(entry.Key))
          .Append("=")
          .Append(WebUtility.UrlEncode(ValueToString(entry.Value)));
        firstEntry = false;
      }
      using (var client = new HttpClient())
      {
        var request = new HttpRequestMessage(HttpMethod.Get, sb.ToString());
        request.Headers.Add("UserAgent", USER_AGENT);
        //request.Headers.Add("Content-Type", "application/x-www-form-urlencoded");
        // TODO: C# is more naturally to use Async Pattern. We shall later change this as
        // This can potentially block the UI thread and create deadlock.
        var response = client.SendAsync(request).Result;
        return response.Content.ReadAsStringAsync().Result;
        //return client.GetStringAsync(sb.ToString()).Result;
      }
    }

    private static string ContentTypeForFile(FileInfo file)
    {
      var extension = file.Extension.ToLowerInvariant();
      string contentType;
      fileToContentTypeMap.TryGetValue(extension, out contentType);
      return contentType;
    }

    // HTTP POST request
    private static string SendPost(string apiUrl, Dictionary<string, object> allParams, APIContext context)
    {
      using (var client = new HttpClient())
      {
        using (var content = new MultipartFormDataContent())
        {
          foreach (var entry in allParams)
          {
            var fileValue = entry.Value as FileInfo;
            if (fileValue != null)
            {
              using (FileStream fs = fileValue.OpenRead())
              {
                content.Add(new StreamContent(fs), fileValue.Name, fileValue.Name);
              }
            }
            else
            {
              content.Add(
                new StringContent(entry.Value.ToString(), Encoding.UTF8),
                entry.Key);
            }
          }
          using (var response = client.PostAsync(apiUrl, content).Result)
          {
            return response.Content.ReadAsStringAsync().Result;
          }
        }
      }
    }

    private static string SendDelete(string apiUrl, Dictionary<string, object> allParams, APIContext context)
    {
      var sb = new StringBuilder(apiUrl);
      bool firstEntry = true;
      foreach (var entry in allParams)
      {
        sb.Append(firstEntry ? "?" : "&")
          .Append(WebUtility.UrlEncode(entry.Key))
          .Append("=")
          .Append(WebUtility.UrlEncode(ValueToString(entry.Value)));
        firstEntry = false;
      }
      using (var client = new HttpClient())
      {
        // TODO: C# is more naturally to use Async Pattern. We shall later change this as
        // This can potentially block the UI thread and create deadlock.
        using (var response = client.DeleteAsync(sb.ToString()).Result)
        {
          return response.Content.ReadAsStringAsync().Result;
        }
      }
    }

    private static string ValueToString(object input)
    {
      if (input == null)
      {
        return "null";
      }
      else if (input is IDictionary<string, object>
        || input is IDictionary<string, string>
        || input is IList<string>
        || input is IList<object>)
      {
        return new JavaScriptSerializer().Serialize(input);
      }
      else
      {
        return input.ToString();
      }
    }

    private Dictionary<string, object> GetAllParams(Dictionary<string, object> extraParams)
    {
      var allParams = new Dictionary<string, object>(this.parameters);
      if (extraParams != null)
      {
        foreach (var pair in extraParams)
        {
          allParams[pair.Key] = pair.Value;
        }
      }
      allParams["access_token"] = this.Context.AccessToken;
      if (this.Context.hasAppSecret())
      {
        allParams["appsecret_proof"] = this.Context.AppSecretProof;
      }
      if (returnFields != null)
      {
        allParams["fields"] = JoinStringList(returnFields);
      }
      return allParams;
    }

    private static string JoinStringList(List<string> list)
    {
      if (list == null) return "";
      return String.Join(",", list.ToArray());
    }

    protected void SetParamInternal(string parameter, object value)
    {
      this.parameters[parameter] = value;
    }

    protected void SetParamsInternal(IDictionary<string, object> parameters)
    {
      this.parameters = parameters;
    }

    protected void RequestFieldInternal(string field, bool value)
    {
      if (this.returnFields == null)
      {
        returnFields = new List<string>();
      }
      if (value == true && !this.returnFields.Contains(field))
      {
        returnFields.Add(field);
      }
      else
      {
        returnFields.Remove(field);
      }
    }
  }
}
