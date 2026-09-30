// Add package:http to your Flutter app: flutter pub add http
// Pass the Worker origin, e.g. https://your-worker.your-subdomain.workers.dev.
import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

typedef JsonObject = Map<String, dynamic>;

enum BookSort { catalog, title, rating }

class ApiException implements Exception {
  const ApiException({
    required this.statusCode,
    required this.code,
    required this.message,
    this.field,
  });

  final int statusCode;
  final String code;
  final String message;
  final String? field;

  @override
  String toString() => 'ApiException($statusCode, $code): $message';
}

class ApiProtocolException implements Exception {
  const ApiProtocolException(this.message);
  final String message;

  @override
  String toString() => 'ApiProtocolException: $message';
}

class ApiTransportException implements Exception {
  const ApiTransportException(this.message, this.cause);
  final String message;
  final Object cause;

  @override
  String toString() => 'ApiTransportException: $message';
}

class ApiMeta {
  ApiMeta._(this.raw);

  factory ApiMeta.fromJson(dynamic value) {
    final json = _object(value, 'meta');
    if (json['apiVersion'] != 'v1' ||
        json['language'] != 'ar' ||
        json['direction'] != 'rtl' ||
        json['isDemo'] != true) {
      throw const ApiProtocolException('Unexpected API metadata.');
    }
    return ApiMeta._(Map<String, dynamic>.unmodifiable(json));
  }

  final JsonObject raw;
  String get apiVersion => raw['apiVersion'] as String;
  String get language => raw['language'] as String;
  String get direction => raw['direction'] as String;
  bool get isDemo => raw['isDemo'] as bool;
}

class ApiEnvelope<T> {
  const ApiEnvelope({required this.data, required this.meta});
  final T data;
  final ApiMeta meta;
}

class Book {
  Book.fromJson(dynamic value) : raw = _object(value, 'book') {
    id = _string(raw, 'id');
    title = _string(raw, 'title');
    author = _string(raw, 'author');
    categoryId = _string(raw, 'categoryId');
    categoryName = _string(raw, 'categoryName');
    description = _string(raw, 'description');
    tagline = _string(raw, 'tagline');
    pageCount = _integer(raw, 'pageCount', minimum: 1);
    chapterCount = _integer(raw, 'chapterCount', minimum: 1);
    coverWidth = _integer(raw, 'coverWidth', minimum: 1);
    coverHeight = _integer(raw, 'coverHeight', minimum: 1);
    coverBackgroundColor = _string(raw, 'coverBackgroundColor');
    final ratingValue = raw['rating'];
    if (ratingValue is! num ||
        !ratingValue.isFinite ||
        ratingValue < 0 ||
        ratingValue > 5) {
      throw const ApiProtocolException('Invalid book rating.');
    }
    rating = ratingValue.toDouble();
    final parsedCoverUri = Uri.tryParse(_string(raw, 'coverUrl'));
    if (parsedCoverUri == null ||
        !['http', 'https'].contains(parsedCoverUri.scheme) ||
        parsedCoverUri.host.isEmpty) {
      throw const ApiProtocolException('Invalid absolute coverUrl.');
    }
    coverUri = parsedCoverUri;
    if (raw['language'] != 'ar' ||
        raw['direction'] != 'rtl' ||
        raw['isFictional'] != true ||
        raw['contentType'] != 'sample') {
      throw const ApiProtocolException('Unexpected book content metadata.');
    }
  }

  final JsonObject raw;
  late final String id;
  late final String title;
  late final String author;
  late final String categoryId;
  late final String categoryName;
  late final String description;
  late final String tagline;
  late final double rating;
  late final int pageCount;
  late final int chapterCount;
  late final int coverWidth;
  late final int coverHeight;
  late final String coverBackgroundColor;
  late final Uri coverUri;
  String get coverUrl => coverUri.toString();
}

class Pagination {
  Pagination.fromJson(dynamic value) {
    final json = _object(value, 'meta.pagination');
    page = _integer(json, 'page', minimum: 1);
    limit = _integer(json, 'limit', minimum: 1);
    total = _integer(json, 'total');
    totalPages = _integer(json, 'totalPages');
    hasNextPage = _boolean(json, 'hasNextPage');
    hasPreviousPage = _boolean(json, 'hasPreviousPage');
    if (limit > 50 || totalPages != (total / limit).ceil()) {
      throw const ApiProtocolException('Inconsistent pagination.');
    }
    if (hasNextPage != (page < totalPages) ||
        hasPreviousPage != (page > 1 && totalPages > 0)) {
      throw const ApiProtocolException('Inconsistent pagination flags.');
    }
  }

  late final int page;
  late final int limit;
  late final int total;
  late final int totalPages;
  late final bool hasNextPage;
  late final bool hasPreviousPage;
}

class BookPage {
  const BookPage({
    required this.books,
    required this.pagination,
    required this.filters,
    required this.meta,
  });

  final List<Book> books;
  final Pagination pagination;
  final JsonObject filters;
  final ApiMeta meta;
}

class MaktabahApi {
  MaktabahApi({
    required String origin,
    http.Client? client,
    this.timeout = const Duration(seconds: 15),
  }) : _origin = _validateOrigin(origin),
       _client = client ?? http.Client(),
       _ownsClient = client == null {
    if (timeout <= Duration.zero) {
      throw ArgumentError.value(timeout, 'timeout', 'Must be positive.');
    }
  }

  final Uri _origin;
  final http.Client _client;
  final bool _ownsClient;
  final Duration timeout;

  Future<BookPage> getBooks({
    String q = '',
    String category = 'all',
    int page = 1,
    int limit = 12,
    BookSort sort = BookSort.catalog,
  }) async {
    if (page < 1 || page > 9007199254740991) {
      throw ArgumentError.value(
        page,
        'page',
        'Must be a positive safe integer.',
      );
    }
    if (limit < 1 || limit > 50) {
      throw ArgumentError.value(limit, 'limit', 'Must be between 1 and 50.');
    }
    if (q.length > 200) {
      throw ArgumentError.value(
        q,
        'q',
        'Must be at most 200 UTF-16 code units.',
      );
    }
    final result = await _get<List<Book>>(
      ['books'],
      (data) => List<Book>.unmodifiable(_list(data, 'data').map(Book.fromJson)),
      query: {
        'q': q,
        'category': category,
        'page': '$page',
        'limit': '$limit',
        'sort': sort.name,
      },
    );
    final pagination = Pagination.fromJson(result.meta.raw['pagination']);
    final filters = _object(result.meta.raw['filters'], 'meta.filters');
    if (_string(filters, 'q') != q ||
        _string(filters, 'category') != category ||
        _string(filters, 'sort') != sort.name ||
        pagination.page != page ||
        pagination.limit != limit ||
        result.data.length > limit ||
        ((pagination.totalPages == 0 || page > pagination.totalPages) &&
            result.data.isNotEmpty)) {
      throw const ApiProtocolException(
        'Catalog response does not match request.',
      );
    }
    return BookPage(
      books: result.data,
      pagination: pagination,
      filters: Map<String, dynamic>.unmodifiable(filters),
      meta: result.meta,
    );
  }

  Future<ApiEnvelope<JsonObject>> getHome({String category = 'all'}) => _get(
    ['home'],
    (data) => _object(data, 'data'),
    query: {'category': category},
  );

  Future<ApiEnvelope<List<JsonObject>>> getCategories() =>
      _get(['categories'], _objectList);

  // Detail includes all Book fields plus chapters and notice.
  Future<ApiEnvelope<JsonObject>> getBook(String bookId) =>
      _get(['books', _bookId(bookId)], (data) => _object(data, 'data'));

  Future<ApiEnvelope<List<JsonObject>>> getChapters(String bookId) =>
      _get(['books', _bookId(bookId), 'chapters'], _objectList);

  Future<ApiEnvelope<JsonObject>> getChapter(String bookId, int index) {
    if (index < 0 || index > 9007199254740991) {
      throw ArgumentError.value(
        index,
        'index',
        'Must be a nonnegative safe integer.',
      );
    }
    return _get([
      'books',
      _bookId(bookId),
      'chapters',
      '$index',
    ], (data) => _object(data, 'data'));
  }

  // Import this only when creating a new local store; do not overwrite user data.
  Future<ApiEnvelope<JsonObject>> getDemoState() =>
      _get(['demo-state'], (data) => _object(data, 'data'));

  Future<ApiEnvelope<T>> _get<T>(
    List<String> segments,
    T Function(dynamic) decodeData, {
    Map<String, String> query = const {},
  }) async {
    // Uri encodes Arabic queries and each path segment without string concatenation.
    final uri = _origin.replace(
      pathSegments: ['api', 'v1', ...segments],
      queryParameters: query.isEmpty ? null : query,
    );
    late final http.Response response;
    try {
      response = await _client
          .get(uri, headers: {'Accept': 'application/json'})
          .timeout(timeout);
    } on TimeoutException catch (error) {
      throw ApiTransportException('The request timed out.', error);
    } on http.ClientException catch (error) {
      throw ApiTransportException('The API could not be reached.', error);
    }

    late final JsonObject json;
    try {
      json = _object(jsonDecode(utf8.decode(response.bodyBytes)), 'response');
    } on FormatException {
      throw ApiProtocolException(
        'HTTP ${response.statusCode} returned invalid JSON/UTF-8.',
      );
    }
    final meta = ApiMeta.fromJson(json['meta']);
    if (response.statusCode != 200) {
      if (json.containsKey('data')) {
        throw const ApiProtocolException(
          'Error response unexpectedly contains data.',
        );
      }
      final error = _object(json['error'], 'error');
      final field = error['field'];
      if (field != null && field is! String) {
        throw const ApiProtocolException('Invalid error field.');
      }
      throw ApiException(
        statusCode: response.statusCode,
        code: _string(error, 'code'),
        message: _string(error, 'message'),
        field: field as String?,
      );
    }
    if (!json.containsKey('data') || json.containsKey('error')) {
      throw const ApiProtocolException(
        'Expected a successful data/meta envelope.',
      );
    }
    return ApiEnvelope(data: decodeData(json['data']), meta: meta);
  }

  // If a shared client was injected, its owner remains responsible for closing it.
  void close() {
    if (_ownsClient) _client.close();
  }
}

Uri _validateOrigin(String value) {
  final uri = Uri.tryParse(value);
  if (uri == null ||
      !['http', 'https'].contains(uri.scheme) ||
      uri.host.isEmpty ||
      uri.userInfo.isNotEmpty ||
      (uri.path.isNotEmpty && uri.path != '/') ||
      uri.hasQuery ||
      uri.hasFragment) {
    throw ArgumentError.value(
      value,
      'origin',
      'Use an absolute http(s) origin without an API path, query, or fragment.',
    );
  }
  return uri;
}

String _bookId(String value) {
  if (value.isEmpty ||
      value == '.' ||
      value == '..' ||
      value.contains('/') ||
      value.contains('\\')) {
    throw ArgumentError.value(
      value,
      'bookId',
      'Use a nonempty single-segment book ID.',
    );
  }
  return value;
}

JsonObject _object(dynamic value, String name) {
  if (value is! Map<String, dynamic>) {
    throw ApiProtocolException('Expected $name to be an object.');
  }
  return value;
}

List<dynamic> _list(dynamic value, String name) {
  if (value is! List<dynamic>) {
    throw ApiProtocolException('Expected $name to be a list.');
  }
  return value;
}

List<JsonObject> _objectList(dynamic value) => List<JsonObject>.unmodifiable(
  _list(value, 'data').map((item) => _object(item, 'data item')),
);

String _string(JsonObject json, String key) {
  final value = json[key];
  if (value is! String)
    throw ApiProtocolException('Expected $key to be a string.');
  return value;
}

int _integer(JsonObject json, String key, {int minimum = 0}) {
  final value = json[key];
  if (value is! int || value < minimum) {
    throw ApiProtocolException('Expected $key to be an integer >= $minimum.');
  }
  return value;
}

bool _boolean(JsonObject json, String key) {
  final value = json[key];
  if (value is! bool)
    throw ApiProtocolException('Expected $key to be a boolean.');
  return value;
}
