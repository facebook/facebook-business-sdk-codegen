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
using System.Runtime.Serialization;

namespace Facebook.Ads.SDK
{
  [Serializable()]
  public class APIException : Exception, IAPIResponse
  {
    public APIException()
    {
    }

    public APIException(string message)
      : base(message)
    {
    }

    public APIException(string message, Exception innerException)
      : base (message, innerException)
    {
    }

    protected APIException(SerializationInfo info, StreamingContext context)
      : base(info, context)
    {
    }

    public APIException Exception
    {
      get { return this; }
    }

    public APINode Head()
    {
      return null;
    }

    public string ToRawResponse()
    {
      return this.Message;
    }

    public override string ToString()
    {
      return this.ToRawResponse();
    }
  }
}
