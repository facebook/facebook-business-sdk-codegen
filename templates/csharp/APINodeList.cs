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

namespace Facebook.Ads.SDK
{
  public class APINodeList<T> : List<T>, IAPIResponse where T : APINode
  {
    private string before;
    private string after;
    private APIRequest<T> request;
    private string rawValue;

    public APINodeList(APIRequest<T> request, string rawValue)
    {
      this.request = request;
      this.rawValue = rawValue;
    }

    public APIException Exception
    {
      get { return null; }
    }

    public APINode Head()
    {
      return this.Count > 0 ? this[0] : null;
    }

    public string ToRawResponse()
    {
      return rawValue;
    }

  }
}
