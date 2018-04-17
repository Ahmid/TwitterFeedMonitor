from __future__ import unicode_literals

import hug
from hug_middleware_cors import CORSMiddleware
import spacy
from elasticsearch import Elasticsearch
import json
import requests
import sys
sys.tracebacklimit = 0

import logging
logging.getLogger("elasticsearch").setLevel(logging.CRITICAL)

import socket
connected = False


MODELS = {
    'en_core_web_sm': spacy.load('en_core_web_sm'),
    # 'de_core_news_sm': spacy.load('de_core_news_sm'),
    # 'es_core_news_sm': spacy.load('es_core_news_sm'),
    # 'pt_core_news_sm': spacy.load('pt_core_news_sm'),
    # 'fr_core_news_sm': spacy.load('fr_core_news_sm'),
    # 'it_core_news_sm': spacy.load('it_core_news_sm'),
    # 'nl_core_news_sm': spacy.load('nl_core_news_sm')
}


def get_model_desc(nlp, model_name):
    """Get human-readable model name, language name and version."""
    lang_cls = spacy.util.get_lang_class(nlp.lang)
    lang_name = lang_cls.__name__
    model_version = nlp.meta['version']
    return '{} - {} (v{})'.format(lang_name, model_name, model_version)


@hug.get('/models')
def models():
    return {name: get_model_desc(nlp, name) for name, nlp in MODELS.items()}


@hug.post('/dep')
def dep(text: str, model: str, collapse_punctuation: bool=False,
        collapse_phrases: bool=False):
    """Get dependencies for displaCy visualizer."""
    nlp = MODELS[model]
    doc = nlp(text)
    if collapse_phrases:
        for np in list(doc.noun_chunks):
            np.merge(tag=np.root.tag_, lemma=np.root.lemma_,
                     ent_type=np.root.ent_type_)
    options = {'collapse_punct': collapse_punctuation}
    return spacy.displacy.parse_deps(doc, options)


@hug.post('/ent')
def ent(text: str, model: str):
    """Get entities for displaCy ENT visualizer."""
    nlp = MODELS[model]
    doc = nlp(text)

    for ent in doc.ents:
        global connected
        if connected:
            es.index(index='test_twitter', doc_type='words', body={'tag': ent.text})
        else:
            print('text :')
            print(ent.text)
            print(ent.label_)

        return {'text': ent.text, 'start': ent.start_char, 'end': ent.end_char, 'label': ent.label_}


if __name__ == '__main__':

    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(('8.8.8.8', 1))  # connect() for UDP doesn't send packets
    local_ip_address = s.getsockname()[0]
    print (local_ip_address)

    reportEngineIPAddress = 'X.X.X.X'
	
    try:
        es = Elasticsearch([{'host': reportEngineIPAddress, 'port': 9200}]).ping()
    except ConnectionRefusedError:
        print ('Connection Error!')

    if es:
        es = Elasticsearch([{'host': reportEngineIPAddress, 'port': 9200}])
        es.indices.delete(index='test_twitter', ignore=[400, 404])
        connected = True
        print('Connected to ES..')
    else:
        print('Not connected to ES...')

    import waitress
    app = hug.API(__name__)
    app.http.add_middleware(CORSMiddleware(app))
    waitress.serve(__hug_wsgi__, host=local_ip_address, port=8000)
